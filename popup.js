const SERVICES = {
  chatgpt: { name: 'ChatGPT' },
  claude: { name: 'Claude' },
  perplexity: { name: 'Perplexity' },
  grok: { name: 'Grok' }
};

document.addEventListener('DOMContentLoaded', async () => {
  const promptInput = document.getElementById('promptInput');
  const blastButton = document.getElementById('blastButton');
  const statusDiv = document.getElementById('status');
  const serviceList = document.getElementById('serviceList');

  const { lastPrompt, selectedServices } = await chrome.storage.local.get(['lastPrompt', 'selectedServices']);
  if (lastPrompt) {
    promptInput.value = lastPrompt;
  }

  Object.entries(SERVICES).forEach(([key, service]) => {
    const div = document.createElement('div');
    div.className = 'service-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = key;
    checkbox.checked = selectedServices?.[key] !== false;
    
    const label = document.createElement('label');
    label.htmlFor = key;
    label.textContent = service.name;
    
    div.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    div.appendChild(checkbox);
    div.appendChild(label);
    serviceList.appendChild(div);
  });

  promptInput.addEventListener('input', () => {
    chrome.storage.local.set({ lastPrompt: promptInput.value });
  });

  serviceList.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
      const selectedServices = {};
      serviceList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        selectedServices[checkbox.id] = checkbox.checked;
      });
      chrome.storage.local.set({ selectedServices });
    }
  });

  blastButton.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      showStatus('Please enter a prompt', 'error');
      return;
    }

    const selectedServices = {};
    serviceList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      selectedServices[checkbox.id] = checkbox.checked;
    });

    if (!Object.values(selectedServices).some(checked => checked)) {
      showStatus('Please select at least one service', 'error');
      return;
    }

    blastButton.disabled = true;
    blastButton.textContent = 'Sending...';
    statusDiv.innerHTML = '';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'blast',
        prompt,
        selectedServices
      });

      const allSuccess = response.every(({ success }) => success);
      if (allSuccess) {
        showStatus('Prompt submitted to all selected services', 'success');
      } else {
        showStatus('Some services failed to receive the prompt', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showStatus(`Error: ${error.message}`, 'error');
    } finally {
      blastButton.disabled = false;
      blastButton.textContent = 'Blast Prompt';
    }
  });

  function showStatus(message, type = 'success') {
    const statusItem = document.createElement('div');
    statusItem.className = `status-item ${type}`;
    statusItem.textContent = message;
    
    statusDiv.innerHTML = '';
    statusDiv.appendChild(statusItem);
    
    if (type === 'success') {
      setTimeout(() => {
        if (statusDiv.contains(statusItem)) {
          statusItem.style.opacity = '0';
          setTimeout(() => {
            if (statusDiv.contains(statusItem)) {
              statusDiv.removeChild(statusItem);
            }
          }, 300);
        }
      }, 5000);
    }
  }

  promptInput.focus();
}); 