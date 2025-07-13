/**
 * Google Apps Script web app endpoint.
 * Parses event text, generates calendar link and ICS file, and stores results in a Sheet.
 *
 * @param {Object} e - Event parameter object from doGet.
 * @return {TextOutput} - JSON response containing parsed data and links.
 */
function doGet(e) {
    const apiKey = API_KEY(); // Read from separate function or Properties
    const model = 'deepseek/deepseek-r1:free';
    const sheetId = SHEET_ID(); // Read from separate function or Properties
  
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("Form Responses 1");
  
    const submittedText = e.parameter.text || "";
    const userEmail = e.parameter.email || "";
    const time = new Date().toISOString();
  
    const prompt = buildPrompt(submittedText, time, userEmail);
  
    const parsed = callOpenRouter(apiKey, model, prompt);
  
    const calendarUrl = buildCalendarUrl(parsed);
    const icsUrl = createICSFile(parsed);
  
    // Append results to Sheet
    sheet.appendRow([
      new Date(), // Timestamp
      submittedText,
      userEmail,
      parsed.title,
      parsed.date,
      parsed.time,
      parsed.description,
      parsed.recurrence,
      calendarUrl,
      icsUrl
    ]);
  
    // Return JSON response
    const output = {
      calendarUrl: calendarUrl,
      icsUrl: icsUrl,
      parsed: parsed
    };
  
    return ContentService
      .createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  /**
   * Builds the prompt text for the LLM.
   *
   * @param {string} text - Input text.
   * @param {string} timestamp - ISO date.
   * @param {string} email - Email if any.
   * @return {string} - Prompt text.
   */
  function buildPrompt(text, timestamp, email) {
    return `
  You will be given a text describing a meeting or important event.
  
  ... (prompt omitted for brevity)
  `;
  }
  
  /**
   * Calls the OpenRouter API to parse event text.
   *
   * @param {string} apiKey - OpenRouter API key.
   * @param {string} model - Model identifier.
   * @param {string} prompt - Prompt text.
   * @return {Object} - Parsed JSON result.
   */
  function callOpenRouter(apiKey, model, prompt) {
    const requestBody = {
      model: model,
      messages: [
        { role: "system", content: "You extract structured meeting data from text." },
        { role: "user", content: prompt }
      ]
    };
  
    const response = UrlFetchApp.fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "post",
      contentType: "application/json",
      headers: { "Authorization": "Bearer " + apiKey },
      payload: JSON.stringify(requestBody)
    });
  
    const json = JSON.parse(response.getContentText());
    const content = json.choices[0].message.content.trim();
  
    try {
      return JSON.parse(content);
    } catch (error) {
      Logger.log("Error parsing JSON: " + error);
      return {
        title: "Meeting",
        date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
        time: "09:00",
        attendees: [],
        description: "Auto-generated meeting",
        recurrence: "NONE"
      };
    }
  }
  
  /**
   * Creates a Google Calendar event URL.
   *
   * @param {Object} parsed - Parsed event data.
   * @return {string} - Calendar event URL.
   */
  function buildCalendarUrl(parsed) {
    const dateNoDash = parsed.date.replace(/-/g, "");
    const startDateTime = dateNoDash + "T" + parsed.time.replace(":", "") + "00";
  
    const timeParts = parsed.time.split(":");
    const endHour = String(Number(timeParts[0]) + 1).padStart(2, '0');
    const endDateTime = dateNoDash + "T" + endHour + timeParts[1] + "00";
  
    const attendeeParam = parsed.attendees && parsed.attendees.length > 0
      ? "&add=" + encodeURIComponent(parsed.attendees.join(","))
      : "";
  
    const recurrenceParam = parsed.recurrence !== "NONE"
      ? "&recur=RRULE:FREQ=" + parsed.recurrence
      : "";
  
    return "https://calendar.google.com/calendar/r/eventedit?" +
      "text=" + encodeURIComponent(parsed.title) +
      "&dates=" + startDateTime + "/" + endDateTime +
      "&details=" + encodeURIComponent(parsed.description) +
      attendeeParam +
      recurrenceParam;
  }
  
  /**
   * Creates an ICS file in Drive and returns a public download link.
   *
   * @param {Object} parsed - Parsed event data.
   * @return {string} - Download URL.
   */
  function createICSFile(parsed) {
    const startDateTime = parsed.date.replace(/-/g, "") + "T" + parsed.time.replace(":", "") + "00";
    const endDateTime = parsed.date.replace(/-/g, "") + "T" + parsed.time.replace(":", "") + "59";
    const rrule = parsed.recurrence !== "NONE" ? "RRULE:FREQ=" + parsed.recurrence : "";
  
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "DTSTART:" + startDateTime,
      "DTEND:" + endDateTime,
      "SUMMARY:" + parsed.title,
      "DESCRIPTION:" + parsed.description,
      rrule,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\n");
  
    const file = DriveApp.createFile(parsed.title + ".ics", icsContent, MimeType.PLAIN_TEXT);
    file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
    return file.getDownloadUrl();
  }
  
  function API_KEY() { return PropertiesService.getScriptProperties().getProperty('OPENROUTER_KEY'); }
  function SHEET_ID() { return PropertiesService.getScriptProperties().getProperty('SHEET_ID'); }
  
  