const SERVICES = {
  chatgpt: {
    url: 'https://chatgpt.com',
    useUrlParam: true,
    paramName: 'q',
    name: 'ChatGPT'
  },
  claude: {
    url: 'https://claude.ai/new',
    useUrlParam: true,
    paramName: 'q',
    needsSubmit: true,
    selector: 'button[aria-label="Send message"]',
    submitType: 'click',
    name: 'Claude'
  },
  perplexity: {
    url: 'https://perplexity.ai/',
    useUrlParam: true,
    paramName: 'q',
    name: 'Perplexity'
  },
  grok: {
    url: 'https://grok.com',
    useUrlParam: true,
    paramName: 'q',
    name: 'Grok'
  }
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'blast') {
    handleBlast(request.prompt, request.selectedServices).then(sendResponse);
    return true; // Keep the message channel open for async response
  }
});

async function handleBlast(prompt, selectedServices) {
  const results = [];
  
  for (const [service, config] of Object.entries(SERVICES)) {
    // Skip if service is not selected
    if (!selectedServices[service]) {
      continue;
    }

    try {
      let url = config.url;
      
      // If service supports URL parameters, encode the prompt and add it to URL
      if (config.useUrlParam) {
        const encodedPrompt = encodeURIComponent(prompt);
        url = `${url}?${config.paramName}=${encodedPrompt}`;
      }

      // Create new tab
      const tab = await chrome.tabs.create({ url, active: false });
      
      // For services that use URL parameters and don't need additional submission
      if (config.useUrlParam && !config.needsSubmit) {
        results.push({
          service,
          success: true
        });
        continue;
      }

      // For services that need DOM manipulation (Claude)
      // Wait for page load
      await new Promise(resolve => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        });
      });

      if (config.needsSubmit) {
        // For Claude, just submit (prompt is in URL)
        const injectionResults = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: submitPrompt,
          args: [config]
        });
        if (injectionResults && injectionResults[0] && injectionResults[0].error) {
          throw new Error(`Service script execution failed for ${service}: ${injectionResults[0].error.message || JSON.stringify(injectionResults[0].error)}`);
        }
      } else {
        // For any other service needing injection (currently none in SERVICES match this path)
        const injectionResults = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: injectPrompt,
          args: [prompt, config]
        });
        if (injectionResults && injectionResults[0] && injectionResults[0].error) {
          throw new Error(`Service script execution failed for ${service}: ${injectionResults[0].error.message || JSON.stringify(injectionResults[0].error)}`);
        }
      }

      results.push({
        service,
        success: true
      });
    } catch (error) {
      console.error(`Error with ${service}:`, error);
      results.push({
        service,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

// Function to submit prompt (used for Claude)
function submitPrompt(config) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const maxWaitTime = 3000; // 3 seconds timeout

    function findAndSubmit() {
      const element = document.querySelector(config.selector);
      
      if (element) {
        try {
          if (config.submitType === 'click') {
            element.click();
          } else {
            // Focus the element and trigger Enter key
            element.focus();
            element.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true
            }));
          }

          resolve();
        } catch (error) {
          reject(new Error(`Failed to submit: ${error.message}`));
        }
      } else if (Date.now() - startTime > maxWaitTime) {
        reject(new Error('Input field not found within timeout'));
      } else {
        setTimeout(findAndSubmit, 100);
      }
    }

    findAndSubmit();
  });
}

// Function to be injected into the page (only used for Gemini now)
function injectPrompt(prompt, config) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const maxWaitTime = 3000; // 3 seconds timeout

    function findAndFillInput() {
      const element = document.querySelector(config.selector);
      
      if (element) {
        try {
          if (config.isContentEditable) {
            element.focus();
            document.execCommand('insertText', false, prompt);
          } else {
            element.value = prompt;
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }

          // Submit the prompt
          if (config.submitType === 'enter') {
            element.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true
            }));
          }

          resolve();
        } catch (error) {
          reject(new Error(`Failed to fill input: ${error.message}`));
        }
      } else if (Date.now() - startTime > maxWaitTime) {
        reject(new Error('Input field not found within timeout'));
      } else {
        setTimeout(findAndFillInput, 100);
      }
    }

    findAndFillInput();
  });
} 