# Codex Setup Guide for Grok Prompt Enhancer

This guide provides step-by-step instructions for Codex to implement the complete Grok Prompt Enhancer project.

## 🎯 Project Overview

**Goal**: Create a Chrome extension that enhances prompts on grok.com using AI, with a Node.js backend deployed on Vercel.

**Components**:
1. Chrome Extension (frontend)
2. Node.js Express Backend (API)
3. OpenRouter Integration (AI processing)
4. Vercel Deployment (hosting)

## 📋 Implementation Checklist

### Phase 1: Backend Development
- [ ] Create `backend/` directory structure
- [ ] Implement Express.js server (`app.js`)
- [ ] Set up package.json with dependencies
- [ ] Configure Vercel deployment (`vercel.json`)
- [ ] Test locally with sample requests
- [ ] Deploy to Vercel
- [ ] Verify API endpoints

### Phase 2: Chrome Extension Development
- [ ] Create `extension/` directory structure
- [ ] Implement manifest.json (v3)
- [ ] Create content script (`content.js`)
- [ ] Build popup interface (`popup.html`, `popup.js`)
- [ ] Add extension icons
- [ ] Test extension locally
- [ ] Update backend URL in extension

### Phase 3: Integration & Testing
- [ ] Connect extension to backend API
- [ ] Test complete workflow
- [ ] Debug any issues
- [ ] Optimize performance
- [ ] Create documentation

## 🛠️ Detailed Implementation Steps

### Step 1: Backend Setup

**Create directory structure:**
```bash
mkdir -p backend
cd backend
```

**Create `package.json`:**
```json
{
  "name": "grok-prompt-enhancer-backend",
  "version": "1.0.0",
  "main": "app.js",
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "cors": "^2.8.5"
  },
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

**Create `app.js`:**
```javascript
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Main enhancement endpoint
app.post('/enhance', async (req, res) => {
  const { prompt, model, enhancementType } = req.body;
  
  // Validation
  if (!prompt || !model || !enhancementType) {
    return res.status(400).json({ 
      error: 'Missing required fields: prompt, model, enhancementType' 
    });
  }

  if (!['quick', 'advanced'].includes(enhancementType)) {
    return res.status(400).json({ 
      error: 'enhancementType must be "quick" or "advanced"' 
    });
  }

  // Define system messages based on enhancement type
  const systemMessages = {
    quick: 'Rewrite this prompt to be clearer, more specific, and more likely to produce a helpful response. Keep it concise but comprehensive.',
    advanced: 'Analyze this prompt and enhance it by: 1) Adding relevant context and background information, 2) Breaking it down into sub-questions if necessary, 3) Ensuring it leads to a deeper, more nuanced understanding, 4) Making it more specific and actionable.'
  };

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: model,
      messages: [
        { role: 'system', content: systemMessages[enhancementType] },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://grok-prompt-enhancer.vercel.app',
        'X-Title': 'Grok Prompt Enhancer'
      }
    });

    const enhancedPrompt = response.data.choices[0].message.content;
    res.json({ 
      enhancedPrompt,
      model: model,
      enhancementType: enhancementType,
      originalLength: prompt.length,
      enhancedLength: enhancedPrompt.length
    });
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to enhance prompt',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Enhancement endpoint: http://localhost:${PORT}/enhance`);
});
```

**Create `vercel.json`:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/health",
      "dest": "app.js"
    },
    {
      "src": "/enhance",
      "dest": "app.js"
    },
    {
      "src": "/(.*)",
      "dest": "app.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 2: Chrome Extension Setup

**Create directory structure:**
```bash
mkdir -p extension/icons
cd extension
```

**Create `manifest.json`:**
```json
{
  "manifest_version": 3,
  "name": "Grok Prompt Enhancer",
  "version": "1.0.0",
  "description": "Enhance your Grok prompts with AI-powered improvements",
  "permissions": [
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "https://grok.com/*",
    "https://*.vercel.app/*"
  ],
  "content_scripts": [
    {
      "matches": ["https://grok.com/*"],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Grok Prompt Enhancer Settings",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

**Create `content.js`:**
```javascript
// Grok Prompt Enhancer Content Script
(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    selectors: [
      'textarea[name="prompt"]',
      'textarea[placeholder*="prompt"]',
      'textarea[placeholder*="ask"]',
      'textarea',
      'input[type="text"]'
    ],
    backendUrl: 'https://your-vercel-url.vercel.app', // UPDATE THIS
    pollInterval: 1000,
    maxRetries: 10
  };

  // State management
  let state = {
    isEnhancing: false,
    retryCount: 0,
    currentInput: null
  };

  // Utility functions
  function findInputField() {
    for (const selector of CONFIG.selectors) {
      const element = document.querySelector(selector);
      if (element && element.offsetParent !== null) {
        return element;
      }
    }
    return null;
  }

  function createEnhancementUI() {
    const container = document.createElement('div');
    container.id = 'grok-enhancer-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-width: 250px;
    `;

    container.innerHTML = `
      <div style="margin-bottom: 10px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">
          Enhancement Type:
        </label>
        <select id="enhancement-type" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="quick">Quick Enhancement</option>
          <option value="advanced">Advanced Enhancement</option>
        </select>
      </div>
      <button id="enhance-btn" style="
        width: 100%;
        padding: 10px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        transition: background 0.2s;
      ">Enhance Prompt</button>
      <div id="status" style="margin-top: 10px; font-size: 12px; color: #666;"></div>
    `;

    return container;
  }

  function updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.style.color = type === 'error' ? '#dc3545' : 
                            type === 'success' ? '#28a745' : '#666';
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
        throw new Error(errorData.error || `HTTP ${response.status}`);
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

    enhanceBtn.addEventListener('click', async () => {
      if (state.isEnhancing) return;

      const inputField = findInputField();
      if (!inputField) {
        updateStatus('No input field found. Please refresh the page.', 'error');
        return;
      }

      const prompt = inputField.value.trim();
      if (!prompt) {
        updateStatus('Please enter a prompt to enhance.', 'error');
        return;
      }

      state.isEnhancing = true;
      state.currentInput = inputField;
      enhanceBtn.disabled = true;
      enhanceBtn.textContent = 'Enhancing...';
      updateStatus('Enhancing your prompt...', 'info');

      try {
        const model = await getSelectedModel();
        const enhancementType = enhancementTypeSelect.value;
        
        const enhancedPrompt = await enhancePrompt(prompt, model, enhancementType);
        
        inputField.value = enhancedPrompt;
        inputField.focus();
        
        // Trigger input event to notify Grok
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        
        updateStatus('Prompt enhanced successfully!', 'success');
      } catch (error) {
        updateStatus(`Error: ${error.message}`, 'error');
      } finally {
        state.isEnhancing = false;
        enhanceBtn.disabled = false;
        enhanceBtn.textContent = 'Enhance Prompt';
      }
    });
  }

  function initializeEnhancer() {
    // Remove existing container if present
    const existingContainer = document.getElementById('grok-enhancer-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    // Create and add new container
    const container = createEnhancementUI();
    document.body.appendChild(container);
    attachEventListeners(container);

    updateStatus('Ready to enhance prompts!', 'success');
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
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(initializeEnhancer, 1000);
      }
    }).observe(document, { subtree: true, childList: true });
  }

  // Start the enhancer
  init();
})();
```

**Create `popup.html`:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Grok Prompt Enhancer Settings</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      width: 300px;
      background: #f8f9fa;
    }
    
    .container {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    h2 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 18px;
      text-align: center;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #555;
    }
    
    select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      background: white;
    }
    
    select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }
    
    button {
      width: 100%;
      padding: 10px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    button:hover {
      background: #0056b3;
    }
    
    button:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }
    
    .status {
      margin-top: 15px;
      padding: 10px;
      border-radius: 4px;
      font-size: 12px;
      text-align: center;
    }
    
    .status.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .status.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    .info {
      margin-top: 15px;
      padding: 10px;
      background: #e7f3ff;
      border: 1px solid #b3d9ff;
      border-radius: 4px;
      font-size: 12px;
      color: #0066cc;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>⚡ Grok Prompt Enhancer</h2>
    
    <div class="form-group">
      <label for="model-select">AI Model:</label>
      <select id="model-select">
        <option value="deepseek/deepseek-coder:33b-instruct">DeepSeek Coder 33B</option>
        <option value="openai/gpt-4o">GPT-4o</option>
        <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
        <option value="google/gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
        <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
      </select>
    </div>
    
    <button id="save-btn">Save Settings</button>
    
    <div id="status" class="status" style="display: none;"></div>
    
    <div class="info">
      <strong>How to use:</strong><br>
      1. Visit grok.com<br>
      2. Enter your prompt<br>
      3. Click "Enhance Prompt"<br>
      4. Choose enhancement type
    </div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
```

**Create `popup.js`:**
```javascript
document.addEventListener('DOMContentLoaded', function() {
  const modelSelect = document.getElementById('model-select');
  const saveBtn = document.getElementById('save-btn');
  const statusDiv = document.getElementById('status');

  // Load saved model
  chrome.storage.sync.get('selectedModel', function(data) {
    if (data.selectedModel) {
      modelSelect.value = data.selectedModel;
    }
  });

  // Save settings
  saveBtn.addEventListener('click', function() {
    const selectedModel = modelSelect.value;
    
    chrome.storage.sync.set({ selectedModel: selectedModel }, function() {
      showStatus('Settings saved successfully!', 'success');
      
      // Update all tabs
      chrome.tabs.query({ url: 'https://grok.com/*' }, function(tabs) {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'settingsUpdated', 
            model: selectedModel 
          });
        });
      });
    });
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
});
```

### Step 3: Create Icons

Create simple placeholder icons or use a service like [Favicon.io](https://favicon.io/) to generate icons:

- `icons/icon16.png` (16x16)
- `icons/icon48.png` (48x48) 
- `icons/icon128.png` (128x128)

### Step 4: Testing & Deployment

**Local Testing:**
```bash
# Backend
cd backend
npm install
npm start

# Test API
curl -X POST http://localhost:3000/enhance \
  -H "Content-Type: application/json" \
  -d '{"prompt":"hello world","model":"deepseek/deepseek-coder:33b-instruct","enhancementType":"quick"}'
```

**Vercel Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd backend
vercel --prod

# Set environment variable
vercel env add OPENROUTER_API_KEY
```

**Extension Testing:**
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension/` folder
6. Visit grok.com and test

## 🔧 Configuration Updates

After deployment, update the backend URL in `content.js`:
```javascript
const CONFIG = {
  // ... other config
  backendUrl: 'https://your-actual-vercel-url.vercel.app', // Update this
  // ... rest of config
};
```

## ✅ Success Criteria

- [ ] Backend responds to `/health` endpoint
- [ ] Backend successfully enhances prompts via `/enhance`
- [ ] Extension loads without errors in Chrome
- [ ] Extension UI appears on grok.com
- [ ] Prompt enhancement works end-to-end
- [ ] Settings are saved and persisted
- [ ] Error handling works properly

## 🚨 Common Issues & Solutions

See `setup/troubleshooting.md` for detailed troubleshooting guide. 