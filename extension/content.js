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
    uiContainer: null
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
      background: white;
      border: 1px solid #e1e5e9;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      min-width: 280px;
      max-width: 350px;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    `;

    container.innerHTML = `
      <div style="margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">
          ⚡ Prompt Enhancer
        </h3>
        <p style="margin: 0 0 15px 0; color: #666; font-size: 12px; line-height: 1.4;">
          Enhance your prompt for better AI responses
        </p>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333; font-size: 13px;">
          Enhancement Type:
        </label>
        <select id="enhancement-type" style="
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          transition: border-color 0.2s;
        ">
          <option value="quick">🚀 Quick Enhancement</option>
          <option value="advanced">🧠 Advanced Enhancement</option>
        </select>
      </div>
      
      <button id="enhance-btn" style="
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
      ">Enhance Prompt</button>
      
      <div id="status" style="
        margin-top: 12px;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        text-align: center;
        min-height: 20px;
        display: none;
      "></div>
      
      <div style="
        margin-top: 15px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 6px;
        font-size: 11px;
        color: #666;
        line-height: 1.4;
      ">
        <strong>💡 Tip:</strong> Quick for simple improvements, Advanced for detailed analysis and context.
      </div>
    `;

    return container;
  }

  function updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.style.display = 'block';
      
      // Set colors based on type
      switch (type) {
        case 'error':
          statusEl.style.background = '#fee';
          statusEl.style.color = '#c53030';
          statusEl.style.border = '1px solid #fed7d7';
          break;
        case 'success':
          statusEl.style.background = '#f0fff4';
          statusEl.style.color = '#2f855a';
          statusEl.style.border = '1px solid #c6f6d5';
          break;
        case 'warning':
          statusEl.style.background = '#fffbeb';
          statusEl.style.color = '#c05621';
          statusEl.style.border = '1px solid #faf089';
          break;
        default:
          statusEl.style.background = '#ebf8ff';
          statusEl.style.color = '#2b6cb0';
          statusEl.style.border = '1px solid #bee3f8';
      }
    }
  }

  async function getSelectedModel() {
    return new Promise(resolve => {
      chrome.storage.sync.get('selectedModel', data => {
        resolve(data.selectedModel || 'deepseek/deepseek-coder:33b-instruct');
      });
    });
  }

  async function enhancePrompt(prompt, model, enhancementType) {
    try {
      const response = await fetch(`${CONFIG.backendUrl}/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model,
          enhancementType
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
    const enhancementTypeSelect = container.querySelector('#enhancement-type');

    // Add hover effects
    enhanceBtn.addEventListener('mouseenter', () => {
      enhanceBtn.style.transform = 'translateY(-1px)';
      enhanceBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });

    enhanceBtn.addEventListener('mouseleave', () => {
      enhanceBtn.style.transform = 'translateY(0)';
      enhanceBtn.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
    });

    enhanceBtn.addEventListener('click', async () => {
      if (state.isEnhancing) return;

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
      enhanceBtn.style.background = '#6c757d';
      updateStatus('🔄 Enhancing your prompt...', 'info');

      try {
        const model = await getSelectedModel();
        const enhancementType = enhancementTypeSelect.value;
        
        const enhancedPrompt = await enhancePrompt(prompt, model, enhancementType);
        
        // Update the input field
        inputField.value = enhancedPrompt;
        inputField.focus();
        
        // Trigger input event to notify Grok
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));
        
        updateStatus('✅ Prompt enhanced successfully!', 'success');
        
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
        enhanceBtn.textContent = 'Enhance Prompt';
        enhanceBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }
    });
  }

  function initializeEnhancer() {
    try {
      // Create and add UI
      const container = createEnhancementUI();
      document.body.appendChild(container);
      state.uiContainer = container;
      
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
      console.log('Settings updated:', message.model);
      // Could add visual feedback here
    }
  });

  // Start the enhancer
  init();
})(); 