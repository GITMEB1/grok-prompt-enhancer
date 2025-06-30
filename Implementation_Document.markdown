# Full Implementation Document for Cursor AI

**Project**: Grok Prompt Enhancer  
**Date**: June 30, 2025  

---

## Introduction

This document outlines the complete implementation for a Chrome extension and backend service designed to enhance prompts for the Grok web app. The project will be built by Cursor AI, pushed to a GitHub repository, and deployed on Vercel for production use.

---

## Architecture Overview

The system comprises two primary components:

1. **Chrome Extension**:
   - Injects an "Enhance Prompt" button into the Grok web app at [grok.com](https://grok.com).
   - Provides options for "Quick" or "Advanced" prompt enhancement and AI model selection.
   - Communicates with a backend service to process and return enhanced prompts.

2. **Backend Service**:
   - A Node.js Express server hosted on Vercel.
   - Accepts prompts, enhancement types, and model selections via a POST endpoint.
   - Integrates with OpenRouter to enhance prompts using the specified AI model.

---

## Backend Implementation

### Prerequisites
- Node.js and npm installed.
- An OpenRouter API key.

### Directory Structure
```
backend/
├── app.js
├── package.json
└── vercel.json
```

### Code Snippets

#### `app.js`
```javascript
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.post('/enhance', async (req, res) => {
  const { prompt, model, enhancementType } = req.body;
  if (!prompt || !model || !enhancementType) {
    return res.status(400).json({ error: 'Prompt, model, and enhancement type are required' });
  }

  let systemMessage;
  if (enhancementType === 'quick') {
    systemMessage = 'Rewrite this prompt to be clearer and more specific.';
  } else if (enhancementType === 'advanced') {
    systemMessage = 'Analyze this prompt and enhance it by adding relevant context, breaking it down into sub-questions if necessary, and ensuring it leads to a deeper understanding.';
  } else {
    return res.status(400).json({ error: 'Invalid enhancement type' });
  }

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const enhancedPrompt = response.data.choices[0].message.content;
    res.json({ enhancedPrompt });
  } catch (error) {
    console.error('Backend error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to enhance prompt' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
```

#### `package.json`
```json
{
  "name": "grok-prompt-enhancer-backend",
  "version": "1.0.0",
  "main": "app.js",
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0"
  },
  "scripts": {
    "start": "node app.js"
  }
}
```

#### `vercel.json`
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
      "src": "/(.*)",
      "dest": "app.js"
    }
  ]
}
```

### Deployment on Vercel
1. Initialize the project: `npm install`.
2. Test locally: `npm start`.
3. Deploy to Vercel:
   - Link the `backend` directory to a Vercel project using `vercel`.
   - Set the `OPENROUTER_API_KEY` environment variable in Vercel’s dashboard.
   - Deploy with `vercel --prod`.
4. Note the deployed URL (e.g., `https://your-vercel-url.vercel.app`) for use in the Chrome extension.

---

## Chrome Extension Implementation

### Directory Structure
```
extension/
├── manifest.json
├── content.js
├── popup.html
├── popup.js
├── icon16.png
├── icon48.png
└── icon128.png
```

### Code Snippets

#### `manifest.json`
```json
{
  "manifest_version": 3,
  "name": "Grok Prompt Enhancer",
  "version": "1.0",
  "description": "Enhances prompts for Grok with a single click.",
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": ["https://grok.com/*"],
  "content_scripts": [
    {
      "matches": ["https://grok.com/*"],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  }
}
```

#### `content.js`
```javascript
document.addEventListener('DOMContentLoaded', () => {
  const inputField = document.querySelector('textarea[name="prompt"]') || document.querySelector('textarea');
  if (!inputField) {
    console.error('Input field not found on Grok page');
    return;
  }

  const enhancementTypeSelect = document.createElement('select');
  enhancementTypeSelect.innerHTML = `
    <option value="quick">Quick</option>
    <option value="advanced">Advanced</option>
  `;
  enhancementTypeSelect.style.marginLeft = '10px';

  const enhanceButton = document.createElement('button');
  enhanceButton.textContent = 'Enhance Prompt';
  enhanceButton.style.marginLeft = '10px';
  enhanceButton.style.padding = '5px 10px';
  enhanceButton.style.backgroundColor = '#007bff';
  enhanceButton.style.color = 'white';
  enhanceButton.style.border = 'none';
  enhanceButton.style.borderRadius = '4px';
  enhanceButton.style.cursor = 'pointer';

  inputField.parentNode.appendChild(enhancementTypeSelect);
  inputField.parentNode.appendChild(enhanceButton);

  enhanceButton.addEventListener('click', async () => {
    enhanceButton.disabled = true;
    enhanceButton.textContent = 'Enhancing...';
    const prompt = inputField.value.trim();
    if (!prompt) {
      alert('Please enter a prompt to enhance.');
      enhanceButton.disabled = false;
      enhanceButton.textContent = 'Enhance Prompt';
      return;
    }

    try {
      const selectedModel = await new Promise(resolve => {
        chrome.storage.sync.get('selectedModel', data => resolve(data.selectedModel || 'deepseek/r1'));
      });
      const enhancementType = enhancementTypeSelect.value;

      const response = await fetch('https://your-vercel-url.vercel.app/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: selectedModel, enhancementType })
      });

      const data = await response.json();
      if (response.ok && data.enhancedPrompt) {
        inputField.value = data.enhancedPrompt;
      } else {
        throw new Error(data.error || 'Failed to enhance prompt');
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      alert(`Error: ${error.message || 'Could not enhance prompt. Please try again.'}`);
    } finally {
      enhanceButton.disabled = false;
      enhanceButton.textContent = 'Enhance Prompt';
    }
  });
});
```

#### `popup.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Grok Prompt Enhancer Settings</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 10px; width: 200px; }
    h3 { margin: 0 0 10px; }
    select, button { width: 100%; margin-bottom: 10px; padding: 5px; }
  </style>
</head>
<body>
  <h3>Select Model</h3>
  <select id="model-select">
    <option value="deepseek/r1">DeepSeek R1</option>
    <option value="gemini/2.5">Gemini 2.5</option>
    <option value="openai/gpt-4o">GPT-4o</option>
  </select>
  <button id="save-btn">Save</button>
  <script src="popup.js"></script>
</body>
</html>
```

#### `popup.js`
```javascript
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get('selectedModel', data => {
    if (data.selectedModel) {
      document.getElementById('model-select').value = data.selectedModel;
    }
  });

  document.getElementById('save-btn').addEventListener('click', () => {
    const selectedModel = document.getElementById('model-select').value;
    chrome.storage.sync.set({ selectedModel }, () => {
      alert('Model saved!');
    });
  });
});
```

#### Icons
- Provide placeholder icons (`icon16.png`, `icon48.png`, `icon128.png`) or replace with custom images.

### Configuration
- Update the `fetch` URL in `content.js` with the actual Vercel deployment URL after deployment.

### Testing
- Load the `extension` directory in Chrome as an unpacked extension (Developer Mode).
- Test on [grok.com](https://grok.com) by entering a prompt and clicking "Enhance Prompt".

---

## GitHub Repository Setup

### Structure
```
grok-prompt-enhancer/
├── backend/
│   ├── app.js
│   ├── package.json
│   └── vercel.json
├── extension/
│   ├── manifest.json
│   ├── content.js
│   ├── popup.html
│   ├── popup.js
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### `README.md`
```markdown
# Grok Prompt Enhancer

Enhances prompts for the Grok web app with a Chrome extension and a Vercel-deployed backend.

## Components
- **Chrome Extension**: Adds an "Enhance Prompt" button to [grok.com](https://grok.com).
- **Backend Service**: Node.js server using OpenRouter for prompt enhancement.

## Setup
1. **Backend**:
   - `cd backend`
   - `npm install`
   - Set `OPENROUTER_API_KEY` in Vercel.
   - Deploy: `vercel --prod`
2. **Extension**:
   - Load `extension/` in Chrome (Developer Mode).
   - Update `content.js` with the Vercel URL.
3. **Usage**:
   - Visit [grok.com](https://grok.com).
   - Enter a prompt, select enhancement type, and click "Enhance Prompt".

## Settings
- Open the extension popup to select an AI model.
```

### Steps
1. Create a GitHub repository: `grok-prompt-enhancer`.
2. Clone locally and set up the structure.
3. Add all files and commit:
   ```
   git add .
   git commit -m "Initial implementation of Grok Prompt Enhancer"
   git push origin main
   ```

---

## Instructions for Cursor AI

1. **Code Implementation**:
   - Use the provided snippets to build the backend and extension.
2. **GitHub**:
   - Create and populate the `grok-prompt-enhancer` repository.
   - Push to the `main` branch.
3. **Vercel Deployment**:
   - Deploy the `backend/` directory.
   - Configure the `OPENROUTER_API_KEY`.
4. **Verification**:
   - Test the extension with the deployed backend URL.

---

## Additional Features
- **Enhancement Types**: "Quick" for simple rewrites, "Advanced" for detailed enhancements.
- **Model Selection**: Choose from multiple AI models in the popup.

---

This document equips Cursor AI with everything needed to build, push, and deploy the Grok Prompt Enhancer.