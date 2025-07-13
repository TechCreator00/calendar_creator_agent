# 📅 Event Parser & Calendar Link Generator

This project helps users **turn free-text event descriptions into structured calendar links and downloadable `.ics` files**.

It has **two main components**:

* A **Google Apps Script API** to parse event text, create calendar links, and generate `.ics` files.
* A **frontend HTML page** that calls the API and displays results.

---

## ✨ What It Does

✅ Users paste text like:

> Tomorrow at 9am, call with John to review contracts.

✅ The system automatically:

* Extracts date, time, title, recurrence, and attendees.
* Generates:

  * A **Google Calendar event link**.
  * A downloadable **ICS file**.
* Shows the structured data back to the user.

---

## 🗂️ Project Structure

```
/index.html       (frontend web page)
/apps_script.gs   (backend Apps Script)
```

---

## 🌐 index.html (Frontend)

**Purpose:**
A single-page HTML form where users paste event text and get back links.

### How it Works

1. The page has:

   * A `<textarea>` for event text.
   * A "Generate Link" button.
2. When clicked, JavaScript calls your **Apps Script web app** via `fetch()`.
3. The response JSON is displayed:

   * Parsed event details.
   * Google Calendar link.
   * ICS file link.

### Configuring

In `index.html`, look for this part:

```javascript
const apiUrl = "YOUR_APPS_SCRIPT_DEPLOYMENT_URL_HERE";
```

**Replace `YOUR_APPS_SCRIPT_DEPLOYMENT_URL_HERE`** with your real **web app URL** from Apps Script (the one ending in `/exec`).

**Example:**

```
https://script.google.com/macros/s/AKfycb.../exec
```

### Hosting

You can host `index.html` for free on:

* GitHub Pages
* Netlify
* Vercel

---

## 🟢 apps\_script.gs (Google Apps Script Backend)

**Purpose:**
Handles incoming requests, calls OpenRouter API to parse text, builds links, and stores results in a Google Sheet.

### Main Functions

#### `doGet(e)`

* Entry point for HTTP GET requests.
* Extracts:

  * `text` parameter (event description).
  * `email` parameter (optional).
* Calls OpenRouter to parse text.
* Creates:

  * Google Calendar event URL.
  * ICS file in Drive (shared as public link).
* Appends the data to a Google Sheet.
* Returns JSON.

#### `buildPrompt()`

Generates the LLM prompt for parsing.

#### `callOpenRouter()`

Calls OpenRouter API with the prompt.

#### `buildCalendarUrl()`

Formats a Google Calendar link with recurrence and attendees.

#### `createICSFile()`

Creates `.ics` file in Drive and makes it public.

#### `API_KEY()`

Returns the OpenRouter API key (see “Hiding Secrets” below).

#### `SHEET_ID()`

Returns your target Spreadsheet ID.

---

## 🔐 Hiding Secrets

**Never commit real API keys or Sheet IDs to GitHub.**

Instead, do this:

1. In `apps_script.gs`, **replace**:

   ```javascript
   function API_KEY() { return 'YOUR_API_KEY_HERE'; }
   function SHEET_ID() { return 'YOUR_SHEET_ID_HERE'; }
   ```

   with:

   ```javascript
   function API_KEY() {
     return PropertiesService.getScriptProperties().getProperty('OPENROUTER_KEY');
   }
   function SHEET_ID() {
     return PropertiesService.getScriptProperties().getProperty('SHEET_ID');
   }
   ```

2. In Apps Script:

   * Go to **Project Settings > Script Properties**.
   * Add:

     * `OPENROUTER_KEY = sk-...`
     * `SHEET_ID = ...`

✅ This keeps your secrets out of source control.

---

## 🛠️ Deploying Apps Script as a Web App

1. In Apps Script:

   * **Deploy > New Deployment**
   * Select **Web app**
   * **Execute as:** Me
   * **Who has access:** Anyone
   * Click **Deploy**
2. Copy the web app URL.
3. Paste it into `index.html` as `apiUrl`.

---

## ✨ Usage Example

1. Open your hosted `index.html`.
2. Paste an event description, e.g.,

   ```
   You know my door is always open. Next Thursday at 7pm.
   ```
3. Click **Generate Link**.
4. You’ll see:

   * Parsed JSON with title, date, time.
   * A Google Calendar event link.
   * A `.ics` download link.

---

## ✅ Future Improvements

* Add authentication to protect the API.
* Improve date parsing logic (e.g., timezones).
* Add styling and branding to \`index