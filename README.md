# Prompt Blaster

Prompt Blaster is a Chrome extension that allows users to send a single prompt to multiple AI platforms—ChatGPT, Claude, Perplexity, and Grok—simultaneously. This tool is designed to streamline the process of interacting with these platforms, making it easier and faster to gather responses from different AI models. It was inspired by a [tweet](https://x.com/nabeel/status/1920866923916538026) highlighting the differences in responses when using APIs versus the native interfaces of each respective LLM.

## Installation

1. Clone or download the repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing this project.

## Usage

- Click the extension icon in the toolbar or use the keyboard shortcut `Ctrl+Shift+P` (or `Command+Shift+P` on Mac) to open the extension.
- Enter your prompt and send it to the supported AI platforms.

## Permissions

This extension requires the following permissions:

- **Tabs:** To interact with the browser tabs.
- **Scripting:** To execute scripts in the context of web pages.
- **Storage:** To store user preferences and settings.
- **Active Tab:** To access the currently active tab.

## Supported Platforms

- [ChatGPT](https://chatgpt.com)
- [Claude](https://claude.ai)
- [Perplexity](https://perplexity.ai)
- [Grok](https://grok.com)

## Development

- **Background Script:** `sw.js` handles background tasks and service worker operations.
- **Popup Interface:** `popup.html` and `popup.js` manage the user interface for the extension popup.
- **Options Page:** `options.html` and `options.js` allow users to configure extension settings.

