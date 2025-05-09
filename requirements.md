# Prompt Blaster Extension – Technical Requirements

## 1. Purpose

Create a Chrome extension that lets a user type a single prompt and automatically fan it out to four LLM web UIs—ChatGPT, Claude, Perplexity, and Grok—by opening each service in a new tab, inserting the prompt into the native text field, and programmatically submitting it.

---

## 2. Scope

* Google Chrome and Chromium‑based browsers that support **Manifest V3**.
* Assumes the user is already authenticated in each service via browser cookies/sessions.
* v0.1 focuses solely on prompt fan‑out (no answer harvesting).

---

## 3. Functional Requirements (FR)

| ID       | Requirement                                                                                                                                                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **FR‑1** | Provide a popup with a single multi‑line text area and a **"Blast"** button.                                                                                                                                                                           |
| **FR‑2** | On clicking **"Blast"**, open 4 tabs, one per target URL: ChatGPT (`https://chatgpt.com`), Claude (`https://claude.ai/new`), Perplexity (`https://perplexity.ai/`), Grok (`https://grok.com/`). |
| **FR‑3** | After each tab finishes loading, inject the prompt into the site's input field and simulate the correct submission event (Enter or click).                                                                                                             |
| **FR‑4** | Persist the last prompt in `chrome.storage.local` and reload it into the popup on open.                                                                                                                                                                |
| **FR‑5** | Display a success/failure toast or badge count for each site.                                                                                                                                                                                          |
| **FR‑6** | If an input field cannot be found within 3 seconds, surface an error notification with the hostname.                                                                                                                                                   |
| **FR‑7** | Allow an *options* page to enable/disable individual destinations and set an optional artificial typing delay (0‑2 s).                                                                                                                                 |

---

## 4. Non‑Functional Requirements (NFR)

| Category          | Requirement                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Performance**   | Total time from click to prompt submission across all tabs ≤ 3 s on a typical broadband connection.                      |
| **Reliability**   | ≥ 95 % success rate for locating DOM selectors per service (tracked via optional telemetry).                             |
| **Security**      | No external network calls; no prompt content leaves the browser. Code executes in an isolated world to respect page CSP. |
| **Privacy**       | Extension stores prompt history only locally; nothing is synced or transmitted.                                          |
| **Usability**     | Keyboard shortcut `Ctrl/⌘+Shift+P` opens the popup with focus in the text area.                                          |
| **Compatibility** | Works on Chrome v115+ and Edge v115+. Tested on macOS, Windows, Linux.                                                   |

---

## 5. Technical Architecture

### 5.1 Manifest

```json
{
  "manifest_version": 3,
  "name": "Prompt Fan‑Out",
  "version": "0.1.0",
  "description": "Send one prompt to ChatGPT, Claude, Perplexity, and Grok in parallel.",
  "permissions": ["tabs", "scripting", "storage", "activeTab"],
  "host_permissions": [
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://perplexity.ai/*",
    "https://grok.com*"
  ],
  "action": { "default_popup": "popup.html", "default_icon": "icons/128.png" },
  "background": { "service_worker": "sw.js" },
  "options_page": "options.html"
}
```

### 5.2 Modules

| Component                       | File                                                       | Role                                                                                                    |
| ------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Popup UI**                    | `popup.html`, `popup.js`                                   | Collect prompt, send `runtime.sendMessage()` to background.                                             |
| **Background (Service Worker)** | `sw.js`                                                    | Receives prompt, creates tabs, waits for `onUpdated` status complete, injects domain‑specific script. |
| **Content Injection**           | `inject.js` (inlined via `chrome.scripting.executeScript`) | Locates textarea/contenteditable, inserts prompt, dispatches `input` + `keydown Enter`.                 |
| **Options**                     | `options.html`, `options.js`                               | Toggle destinations, typing delay.                                                                      |

---

## 6. Domain‑Specific Selectors & Submission Logic

| Service    | Selector(s)                            | Submission Event                                                    |
| ---------- | -------------------------------------- | ------------------------------------------------------------------- |
| ChatGPT    | `textarea[tabindex="0"]`               | Simulate Enter key.                                                 |
| Claude     | `[data-testid="query-input"] textarea` | Enter.                                                              |
| Perplexity | `[data-testid="query-input"] textarea` | Enter.                                                              |
| Grok       | `.ProseMirror` contenteditable         | Insert text via `document.execCommand('insertText')`, then Enter.   |

*Selectors must be wrapped in retry logic (`setInterval`, 100 ms, max 3 s).*
*If not found, send `chrome.notifications.create()` with failure message.*

---

## 7. Error Handling & Telemetry

* Use `chrome.notifications` for per‑site failures.
* Badge text shows number of failures.
* (Optional) Anonymous local counters for success/fail by hostname shown in options page.

---

## 8. Packaging & CI

1. ESLint + Prettier + TypeScript (strict).
2. GitHub Actions: lint, build, zip artifact.
3. Manual upload to Chrome Web Store; automated submission later.

---

## 9. Testing

| Layer  | Tool            | What to Test                                                                    |
| ------ | --------------- | ------------------------------------------------------------------------------- |
| Unit   | Jest            | DOM selector helpers, retry util.                                               |
| E2E    | Puppeteer       | Sign‑in stub, ensure prompt appears in each destination and Enter is triggered. |
| Manual | Chrome DevTools | Authentication edge cases, rate‑limit pop‑ups.                                  |

---

## 10. Future Enhancements (Out of Scope v0.1)

* Response scraping + aggregation.
* Local vector store for answer retrieval.
* Multi‑profile auth management.
* Firefox / Safari support.

---

*End of requirements.*
