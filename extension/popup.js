// Grok Prompt Enhancer Popup Script
document.addEventListener('DOMContentLoaded', function() {
  const modelSelect = document.getElementById('model-select');
  const saveBtn = document.getElementById('save-btn');
  const statusDiv = document.getElementById('status');

  // Model information for tooltips
  const modelInfo = {
    'deepseek/deepseek-coder:33b-instruct': {
      name: 'DeepSeek Coder 33B',
      description: 'Specialized for coding tasks, great for technical prompts',
      speed: 'Fast',
      cost: 'Low'
    },
    'openai/gpt-4o': {
      name: 'GPT-4o',
      description: 'Most capable model, excellent for complex reasoning',
      speed: 'Medium',
      cost: 'High'
    },
    'anthropic/claude-3.5-sonnet': {
      name: 'Claude 3.5 Sonnet',
      description: 'Balanced performance, good for general tasks',
      speed: 'Fast',
      cost: 'Medium'
    },
    'google/gemini-2.0-flash-exp': {
      name: 'Gemini 2.0 Flash',
      description: 'Fast and efficient, good for quick enhancements',
      speed: 'Very Fast',
      cost: 'Low'
    },
    'meta-llama/llama-3.1-70b-instruct': {
      name: 'Llama 3.1 70B',
      description: 'Open source model, good general performance',
      speed: 'Medium',
      cost: 'Low'
    },
    'mistralai/mistral-7b-instruct': {
      name: 'Mistral 7B',
      description: 'Lightweight and fast, good for simple tasks',
      speed: 'Very Fast',
      cost: 'Very Low'
    }
  };

  // Load saved model
  function loadSavedModel() {
    chrome.storage.sync.get('selectedModel', function(data) {
      if (data.selectedModel) {
        modelSelect.value = data.selectedModel;
        updateModelInfo();
      }
    });
  }

  // Update model information display
  function updateModelInfo() {
    const selectedModel = modelSelect.value;
    const info = modelInfo[selectedModel];
    
    if (info) {
      const modelInfoEl = document.querySelector('.model-info');
      if (modelInfoEl) {
        modelInfoEl.innerHTML = `
          <strong>${info.name}</strong><br>
          ${info.description}<br>
          Speed: ${info.speed} | Cost: ${info.cost}
        `;
      }
    }
  }

  // Show status message
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }

  // Save settings
  function saveSettings() {
    const selectedModel = modelSelect.value;
    
    // Disable button during save
    saveBtn.disabled = true;
    saveBtn.textContent = '💾 Saving...';
    
    chrome.storage.sync.set({ selectedModel: selectedModel }, function() {
      if (chrome.runtime.lastError) {
        showStatus('❌ Failed to save settings: ' + chrome.runtime.lastError.message, 'error');
      } else {
        showStatus('✅ Settings saved successfully!', 'success');
        
        // Update all tabs with the extension
        chrome.tabs.query({ url: 'https://grok.com/*' }, function(tabs) {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'settingsUpdated', 
              model: selectedModel 
            }).catch(() => {
              // Ignore errors if content script isn't loaded
            });
          });
        });
      }
      
      // Re-enable button
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Save Settings';
    });
  }

  // Event listeners
  modelSelect.addEventListener('change', updateModelInfo);
  saveBtn.addEventListener('click', saveSettings);

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveSettings();
    }
    
    // Enter to save when select is focused
    if (e.key === 'Enter' && document.activeElement === modelSelect) {
      saveSettings();
    }
  });

  // Initialize
  loadSavedModel();
  updateModelInfo();

  // Add some helpful animations
  saveBtn.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-1px)';
  });

  saveBtn.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0)';
  });

  // Add model selection animation
  modelSelect.addEventListener('change', function() {
    this.style.transform = 'scale(1.02)';
    setTimeout(() => {
      this.style.transform = 'scale(1)';
    }, 150);
  });

  // Show welcome message on first load
  chrome.storage.sync.get('firstLoad', function(data) {
    if (!data.firstLoad) {
      showStatus('🎉 Welcome to Grok Prompt Enhancer!', 'success');
      chrome.storage.sync.set({ firstLoad: true });
    }
  });
}); 