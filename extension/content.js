// Grok Prompt Enhancer Content Script
(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    selectors: [
      'textarea[name="prompt"]',
      'textarea[placeholder*="prompt"]',
      'textarea[placeholder*="ask"]',
      'textarea[placeholder*="message"]',
      'textarea',
      'input[type="text"]'
    ],
    backendUrl: 'https://grok-prompt-enhancer.vercel.app', // Production deployment URL
    pollInterval: 1000,
    maxRetries: 10,
    uiId: 'grok-enhancer-container'
  };

  // State management
  let state = {
    isEnhancing: false,
    retryCount: 0,
    currentInput: null,
    uiContainer: null,
    selectedMode: null
  };

  // Mode configurations
  const modeConfig = {
    'deep-research': {
      name: 'Deep Research',
      icon: '🔍',
      color: '#4ecdc4',
      prompt_prefix: 'Conduct thorough research on this topic with multiple sources and provide detailed analysis:'
    },
    'think-mode': {
      name: 'Think Mode',
      icon: '🧠',
      color: '#96ceb4',
      prompt_prefix: 'Think through this step-by-step with logical reasoning and provide a detailed analysis:'
    },
    'quick-refine': {
      name: 'Quick Refine',
      icon: '⚡',
      color: '#45b7d1',
      prompt_prefix: 'Quickly enhance and clarify this prompt for better results:'
    }
  };

  // Utility functions
  function findInputField() {
    for (const selector of CONFIG.selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (element.offsetParent !== null && 
            element.style.display !== 'none' && 
            element.style.visibility !== 'hidden' &&
            element.getBoundingClientRect().width > 0) {
          return element;
        }
      }
    }
    return null;
  }

  function createEnhancementUI() {
    // Remove existing UI if present
    const existingContainer = document.getElementById(CONFIG.uiId);
    if (existingContainer) {
      existingContainer.remove();
    }

    const container = document.createElement('div');
    container.id = CONFIG.uiId;
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: rgba(20, 20, 20, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, 'Helvetica Neue', Arial, sans-serif;
      min-width: 320px;
      max-width: 380px;
      backdrop-filter: blur(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: #ffffff;
      opacity: 0;
      transform: translateY(-10px);
      animation: slideIn 0.4s ease-out forwards;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      .pulse { animation: pulse 2s infinite; }
    `;
    document.head.appendChild(style);

    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 8px 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">
          ⚡ Prompt Enhancer
        </h3>
        <p style="margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.4;">
          Choose your enhancement mode
        </p>
      </div>
      
      <div id="mode-selector" style="margin-bottom: 20px;">
        <div style="color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 600; margin-bottom: 12px;">
          Enhancement Mode:
        </div>
        <div id="mode-loading" style="
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
          text-align: center;
          padding: 20px;
        ">Loading your preference...</div>
      </div>
      
      <button id="enhance-btn" style="
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
        color: #000000;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 16px rgba(78, 205, 196, 0.3);
        position: relative;
        overflow: hidden;
        disabled: true;
      " disabled>Select Mode First</button>
      
      <div id="status" style="
        margin-top: 16px;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        text-align: center;
        min-height: 20px;
        display: none;
        backdrop-filter: blur(10px);
      "></div>
      
      <div style="
        margin-top: 20px;
        padding: 16px;
        background: rgba(40, 40, 40, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.4;
        backdrop-filter: blur(10px);
      ">
        <strong style="color: #4ecdc4;">💡 Tip:</strong> Each mode is optimized for different types of prompts and use cases.
      </div>
    `;

    return container;
  }

  function createModeButtons(selectedMode) {
    const modeSelector = document.getElementById('mode-selector');
    const modeLoading = document.getElementById('mode-loading');
    
    if (modeLoading) {
      modeLoading.remove();
    }

    let buttonsHtml = '';
    Object.entries(modeConfig).forEach(([mode, config]) => {
      const isSelected = mode === selectedMode;
      buttonsHtml += `
        <div class="mode-option" data-mode="${mode}" style="
          background: ${isSelected ? 'rgba(78, 205, 196, 0.1)' : 'rgba(30, 30, 30, 0.8)'};
          border: 2px solid ${isSelected ? '#4ecdc4' : 'rgba(255, 255, 255, 0.1)'};
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          ${isSelected ? 'box-shadow: 0 0 20px rgba(78, 205, 196, 0.3);' : ''}
        ">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">${config.icon}</span>
            <span style="color: #ffffff; font-weight: 600; font-size: 14px;">${config.name}</span>
            ${isSelected ? '<span style="margin-left: auto; color: #4ecdc4; font-weight: bold;">✓</span>' : ''}
          </div>
        </div>
      `;
    });

    const buttonsContainer = document.createElement('div');
    buttonsContainer.innerHTML = buttonsHtml;
    modeSelector.appendChild(buttonsContainer);

    // Attach click handlers
    buttonsContainer.querySelectorAll('.mode-option').forEach(button => {
      button.addEventListener('click', () => {
        const mode = button.dataset.mode;
        selectMode(mode);
      });

      button.addEventListener('mouseenter', () => {
        if (!button.dataset.mode === state.selectedMode) {
          button.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          button.style.transform = 'translateY(-1px)';
        }
      });

      button.addEventListener('mouseleave', () => {
        if (!button.dataset.mode === state.selectedMode) {
          button.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          button.style.transform = 'translateY(0)';
        }
      });
    });
  }

  function selectMode(mode) {
    state.selectedMode = mode;
    const config = modeConfig[mode];
    
    // Update visual selection
    document.querySelectorAll('.mode-option').forEach(option => {
      const isSelected = option.dataset.mode === mode;
      option.style.background = isSelected ? 'rgba(78, 205, 196, 0.1)' : 'rgba(30, 30, 30, 0.8)';
      option.style.borderColor = isSelected ? '#4ecdc4' : 'rgba(255, 255, 255, 0.1)';
      option.style.boxShadow = isSelected ? '0 0 20px rgba(78, 205, 196, 0.3)' : 'none';
      
      // Update checkmark
      const checkmark = option.querySelector('span:last-child');
      if (isSelected && !checkmark.textContent.includes('✓')) {
        checkmark.innerHTML = '<span style="margin-left: auto; color: #4ecdc4; font-weight: bold;">✓</span>';
      } else if (!isSelected && checkmark.textContent.includes('✓')) {
        checkmark.innerHTML = '';
      }
    });

    // Update enhance button
    const enhanceBtn = document.getElementById('enhance-btn');
    enhanceBtn.disabled = false;
    enhanceBtn.textContent = `${config.icon} Enhance with ${config.name}`;
    enhanceBtn.style.background = `linear-gradient(135deg, ${config.color} 0%, ${config.color}cc 100%)`;
    
    updateStatus(`✅ ${config.name} mode selected!`, 'success');
  }

  function updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.style.display = 'block';
      
      // Set colors based on type
      switch (type) {
        case 'error':
          statusEl.style.background = 'rgba(255, 107, 107, 0.2)';
          statusEl.style.color = '#ff6b6b';
          statusEl.style.border = '1px solid rgba(255, 107, 107, 0.3)';
          break;
        case 'success':
          statusEl.style.background = 'rgba(78, 205, 196, 0.2)';
          statusEl.style.color = '#4ecdc4';
          statusEl.style.border = '1px solid rgba(78, 205, 196, 0.3)';
          statusEl.classList.add('pulse');
          setTimeout(() => statusEl.classList.remove('pulse'), 2000);
          break;
        case 'warning':
          statusEl.style.background = 'rgba(255, 193, 7, 0.2)';
          statusEl.style.color = '#ffc107';
          statusEl.style.border = '1px solid rgba(255, 193, 7, 0.3)';
          break;
        default:
          statusEl.style.background = 'rgba(69, 183, 209, 0.2)';
          statusEl.style.color = '#45b7d1';
          statusEl.style.border = '1px solid rgba(69, 183, 209, 0.3)';
      }
    }
  }

  async function getSelectedMode() {
    return new Promise(resolve => {
      chrome.storage.sync.get(['selectedMode', 'modeInfo'], data => {
        resolve({
          mode: data.selectedMode || 'quick-refine',
          modeInfo: data.modeInfo || modeConfig['quick-refine']
        });
      });
    });
  }

  async function enhancePrompt(prompt, mode, modeInfo) {
    try {
      const response = await fetch(`${CONFIG.backendUrl}/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          mode,
          modeInfo,
          enhancementType: mode // For backward compatibility
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.enhancedPrompt;
    } catch (error) {
      console.error('Enhancement error:', error);
      throw error;
    }
  }

  function attachEventListeners(container) {
    const enhanceBtn = container.querySelector('#enhance-btn');

    // Add button hover effects
    enhanceBtn.addEventListener('mouseenter', () => {
      if (!enhanceBtn.disabled) {
        enhanceBtn.style.transform = 'translateY(-2px)';
        enhanceBtn.style.boxShadow = '0 8px 24px rgba(78, 205, 196, 0.4)';
      }
    });

    enhanceBtn.addEventListener('mouseleave', () => {
      if (!enhanceBtn.disabled) {
        enhanceBtn.style.transform = 'translateY(0)';
        enhanceBtn.style.boxShadow = '0 4px 16px rgba(78, 205, 196, 0.3)';
      }
    });

    enhanceBtn.addEventListener('click', async () => {
      if (state.isEnhancing || !state.selectedMode) return;

      const inputField = findInputField();
      if (!inputField) {
        updateStatus('❌ No input field found. Please refresh the page.', 'error');
        return;
      }

      const prompt = inputField.value.trim();
      if (!prompt) {
        updateStatus('❌ Please enter a prompt to enhance.', 'error');
        return;
      }

      if (prompt.length < 3) {
        updateStatus('❌ Prompt is too short. Please enter a longer prompt.', 'error');
        return;
      }

      state.isEnhancing = true;
      state.currentInput = inputField;
      enhanceBtn.disabled = true;
      enhanceBtn.textContent = '🔄 Enhancing...';
      enhanceBtn.style.background = 'rgba(100, 100, 100, 0.3)';
      enhanceBtn.style.color = 'rgba(255, 255, 255, 0.5)';
      updateStatus('🔄 Enhancing your prompt...', 'info');

      try {
        const { mode, modeInfo } = await getSelectedMode();
        const config = modeConfig[state.selectedMode] || modeConfig[mode];
        
        const enhancedPrompt = await enhancePrompt(prompt, state.selectedMode || mode, modeInfo);
        
        // Update the input field
        inputField.value = enhancedPrompt;
        inputField.focus();
        
        // Trigger input event to notify Grok
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));
        
        updateStatus(`✅ Enhanced with ${config.name}!`, 'success');
        
        // Show character count improvement
        const improvement = enhancedPrompt.length - prompt.length;
        if (improvement > 0) {
          setTimeout(() => {
            updateStatus(`✅ Enhanced! Added ${improvement} characters for better results.`, 'success');
          }, 2000);
        }
        
      } catch (error) {
        let errorMessage = '❌ Failed to enhance prompt.';
        
        if (error.message.includes('timeout')) {
          errorMessage = '⏰ Request timed out. Please try again.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = '🚫 Rate limit exceeded. Please wait a moment.';
        } else if (error.message.includes('network')) {
          errorMessage = '🌐 Network error. Please check your connection.';
        } else if (error.message.includes('API key')) {
          errorMessage = '🔑 API configuration error. Please contact support.';
        }
        
        updateStatus(errorMessage, 'error');
      } finally {
        state.isEnhancing = false;
        enhanceBtn.disabled = false;
        if (state.selectedMode) {
          const config = modeConfig[state.selectedMode];
          enhanceBtn.textContent = `${config.icon} Enhance with ${config.name}`;
          enhanceBtn.style.background = `linear-gradient(135deg, ${config.color} 0%, ${config.color}cc 100%)`;
          enhanceBtn.style.color = '#000000';
        }
      }
    });
  }

  async function initializeEnhancer() {
    try {
      // Create and add UI
      const container = createEnhancementUI();
      document.body.appendChild(container);
      state.uiContainer = container;
      
      // Load saved mode and create mode buttons
      const { mode } = await getSelectedMode();
      state.selectedMode = mode;
      createModeButtons(mode);
      
      // Attach event listeners
      attachEventListeners(container);
      
      // Initial status
      updateStatus('✅ Ready to enhance prompts!', 'success');
      
      console.log('Grok Prompt Enhancer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Grok Prompt Enhancer:', error);
    }
  }

  // Main initialization
  function init() {
    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeEnhancer);
    } else {
      initializeEnhancer();
    }

    // Re-initialize on navigation (for SPAs)
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(initializeEnhancer, 1000);
      }
    });
    
    observer.observe(document, { subtree: true, childList: true });
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'settingsUpdated') {
      console.log('Settings updated:', message.mode);
      state.selectedMode = message.mode;
      
      // Update UI if it exists
      if (document.getElementById(CONFIG.uiId)) {
        createModeButtons(message.mode);
        updateStatus(`✅ Updated to ${message.modeInfo.name} mode!`, 'success');
      }
    }
  });

  // Start the enhancer
  init();
})(); 