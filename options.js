document.addEventListener('DOMContentLoaded', async () => {
  const serviceList = document.getElementById('serviceList');
  const delaySlider = document.getElementById('delaySlider');
  const delayValue = document.getElementById('delayValue');
  const saveButton = document.getElementById('saveButton');
  const statusDiv = document.getElementById('status');

  // Define SERVICES for the options page
  const SERVICES = {
    chatgpt: { name: 'ChatGPT' },
    claude: { name: 'Claude' },
    perplexity: { name: 'Perplexity' },
    grok: { name: 'Grok' }
  };

  // Load saved options
  const { enabledServices = {}, typingDelay = 0 } = await chrome.storage.sync.get(['enabledServices', 'typingDelay']);

  // Populate services list
  Object.entries(SERVICES).forEach(([key, service]) => {
    const div = document.createElement('div');
    div.className = 'service-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = key;
    checkbox.checked = enabledServices[key] !== false; // Default to true if not set
    
    const label = document.createElement('label');
    label.htmlFor = key;
    label.textContent = service.name || key.charAt(0).toUpperCase() + key.slice(1);
    
    div.appendChild(checkbox);
    div.appendChild(label);
    serviceList.appendChild(div);
  });

  // Set initial delay value
  delaySlider.value = typingDelay;
  delayValue.textContent = `${typingDelay}ms`;

  // Update delay value display
  delaySlider.addEventListener('input', () => {
    delayValue.textContent = `${delaySlider.value}ms`;
  });

  // Save options
  saveButton.addEventListener('click', async () => {
    const enabledServices = {};
    document.querySelectorAll('#serviceList input[type="checkbox"]').forEach(checkbox => {
      enabledServices[checkbox.id] = checkbox.checked;
    });

    try {
      await chrome.storage.sync.set({
        enabledServices,
        typingDelay: parseInt(delaySlider.value)
      });

      statusDiv.textContent = 'Options saved successfully!';
      statusDiv.className = 'status success';
      setTimeout(() => {
        statusDiv.className = 'status';
      }, 3000);
    } catch (error) {
      statusDiv.textContent = `Error saving options: ${error.message}`;
      statusDiv.className = 'status error';
    }
  });
}); 