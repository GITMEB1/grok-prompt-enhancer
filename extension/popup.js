// Grok Prompt Enhancer Popup Script
document.addEventListener('DOMContentLoaded', function() {
  const optionCards = document.querySelectorAll('.option-card');
  const saveBtn = document.getElementById('save-btn');
  const statusDiv = document.getElementById('status');
  
  let selectedMode = null;

  // Mode information for enhanced prompt crafting
  const modeInfo = {
    'deep-research': {
      name: 'Deep Research',
      description: 'Comprehensive analysis with web search capabilities',
      prompt_prefix: 'Conduct thorough research on this topic with multiple sources and provide detailed analysis:',
      features: ['Real-time web data', 'Multiple sources', 'In-depth analysis', 'Citation support']
    },
    'think-mode': {
      name: 'Think Mode',
      description: 'Advanced reasoning with step-by-step problem solving',
      prompt_prefix: 'Think through this step-by-step with logical reasoning and provide a detailed analysis:',
      features: ['Logical reasoning', 'Step-by-step analysis', 'Context-aware', 'Problem decomposition']
    },
    'quick-refine': {
      name: 'Quick Refine',
      description: 'Fast prompt optimization for immediate improvements',
      prompt_prefix: 'Quickly enhance and clarify this prompt for better results:',
      features: ['Instant enhancement', 'Clarity focused', 'Time efficient', 'Concise output']
    }
  };

  // Load saved mode
  function loadSavedMode() {
    chrome.storage.sync.get('selectedMode', function(data) {
      if (data.selectedMode) {
        selectedMode = data.selectedMode;
        updateSelection();
      }
    });
  }

  // Update visual selection
  function updateSelection() {
    optionCards.forEach(card => {
      card.classList.remove('selected');
      if (card.dataset.mode === selectedMode) {
        card.classList.add('selected');
      }
    });
    
    // Enable save button if mode is selected
    saveBtn.disabled = !selectedMode;
    
    if (selectedMode) {
      saveBtn.textContent = `💾 Save ${modeInfo[selectedMode].name}`;
    } else {
      saveBtn.textContent = '💾 Save Preference';
    }
  }

  // Show status message
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    // Add pulse animation for success
    if (type === 'success') {
      statusDiv.classList.add('pulse');
    }
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
      statusDiv.classList.remove('pulse');
    }, 3000);
  }

  // Save settings
  function saveSettings() {
    if (!selectedMode) {
      showStatus('❌ Please select an enhancement mode first', 'error');
      return;
    }
    
    // Disable button during save
    saveBtn.disabled = true;
    saveBtn.textContent = '💾 Saving...';
    
    const modeData = {
      selectedMode: selectedMode,
      modeInfo: modeInfo[selectedMode]
    };
    
    chrome.storage.sync.set(modeData, function() {
      if (chrome.runtime.lastError) {
        showStatus('❌ Failed to save settings: ' + chrome.runtime.lastError.message, 'error');
      } else {
        showStatus(`✅ ${modeInfo[selectedMode].name} mode saved successfully!`, 'success');
        
        // Update all tabs with the extension
        chrome.tabs.query({ url: 'https://grok.com/*' }, function(tabs) {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'settingsUpdated', 
              mode: selectedMode,
              modeInfo: modeInfo[selectedMode]
            }).catch(() => {
              // Ignore errors if content script isn't loaded
            });
          });
        });
      }
      
      // Re-enable button
      updateSelection();
    });
  }

  // Handle option card clicks
  function handleCardSelection(e) {
    const card = e.currentTarget;
    const mode = card.dataset.mode;
    
    // Remove previous selection
    optionCards.forEach(c => c.classList.remove('selected'));
    
    // Add selection to clicked card
    card.classList.add('selected');
    selectedMode = mode;
    
    // Update save button
    updateSelection();
    
    // Add selection animation
    card.style.transform = 'scale(1.02)';
    setTimeout(() => {
      card.style.transform = '';
    }, 150);
  }

  // Add hover effects for cards
  function addCardHoverEffects() {
    optionCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        if (!this.classList.contains('selected')) {
          this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }
      });
      
      card.addEventListener('mouseleave', function() {
        if (!this.classList.contains('selected')) {
          this.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }
      });
    });
  }

  // Event listeners
  optionCards.forEach(card => {
    card.addEventListener('click', handleCardSelection);
  });
  
  saveBtn.addEventListener('click', saveSettings);

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveSettings();
    }
    
    // Number keys to select modes (1, 2, 3)
    if (e.key >= '1' && e.key <= '3') {
      const modeIndex = parseInt(e.key) - 1;
      const modes = ['deep-research', 'think-mode', 'quick-refine'];
      if (modes[modeIndex]) {
        selectedMode = modes[modeIndex];
        updateSelection();
      }
    }
    
    // Enter to save when a mode is selected
    if (e.key === 'Enter' && selectedMode) {
      saveSettings();
    }
    
    // Escape to clear selection
    if (e.key === 'Escape') {
      selectedMode = null;
      updateSelection();
    }
  });

  // Add smooth animations
  function addAnimations() {
    // Stagger card animations on load
    optionCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });
    
    // Animate save button
    setTimeout(() => {
      saveBtn.style.opacity = '0';
      saveBtn.style.transform = 'translateY(20px)';
      saveBtn.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      
      setTimeout(() => {
        saveBtn.style.opacity = '1';
        saveBtn.style.transform = 'translateY(0)';
      }, 50);
    }, 300);
  }

  // Initialize
  loadSavedMode();
  addCardHoverEffects();
  addAnimations();

  // Show welcome message on first load
  chrome.storage.sync.get('firstLoad', function(data) {
    if (!data.firstLoad) {
      setTimeout(() => {
        showStatus('🎉 Welcome to the new Grok experience!', 'success');
      }, 1000);
      chrome.storage.sync.set({ firstLoad: true });
    }
  });

  // Add tooltip functionality for mode cards
  function addTooltips() {
    optionCards.forEach(card => {
      const mode = card.dataset.mode;
      const info = modeInfo[mode];
      
      card.title = `${info.name}: ${info.description}\nFeatures: ${info.features.join(', ')}`;
    });
  }

  addTooltips();
}); 