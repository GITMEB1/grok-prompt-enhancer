# Troubleshooting Guide

Comprehensive troubleshooting guide for the Grok Prompt Enhancer project.

## 🚨 Common Issues & Solutions

### Backend Issues

#### 1. Server Won't Start
**Symptoms**: `npm start` fails or server crashes on startup

**Solutions**:
```bash
# Check Node.js version
node --version  # Should be 16+

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for port conflicts
lsof -i :3000  # Check if port 3000 is in use
# Kill process if needed: kill -9 <PID>
```

**Common Causes**:
- Node.js version too old
- Corrupted dependencies
- Port already in use
- Missing environment variables

#### 2. OpenRouter API Errors
**Symptoms**: `500 Internal Server Error` or `Failed to enhance prompt`

**Solutions**:
```javascript
// Check API key is set
console.log('API Key exists:', !!process.env.OPENROUTER_API_KEY);

// Test API key manually
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek/deepseek-coder:33b-instruct","messages":[{"role":"user","content":"test"}]}'
```

**Common Causes**:
- Invalid or expired API key
- Insufficient credits/quota
- Network connectivity issues
- Rate limiting

#### 3. CORS Errors
**Symptoms**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solutions**:
```javascript
// Ensure CORS is properly configured
const cors = require('cors');
app.use(cors({
  origin: ['https://grok.com', 'chrome-extension://*'],
  credentials: true
}));
```

**Common Causes**:
- Missing CORS middleware
- Incorrect origin configuration
- Preflight request failures

#### 4. Vercel Deployment Issues
**Symptoms**: Deployment fails or API returns 404

**Solutions**:
```bash
# Check Vercel configuration
vercel --version
vercel env ls  # List environment variables

# Redeploy with debug info
vercel --debug

# Check function logs
vercel logs
```

**Common Causes**:
- Missing environment variables
- Incorrect `vercel.json` configuration
- Build errors
- Function timeout

### Chrome Extension Issues

#### 1. Extension Won't Load
**Symptoms**: Extension doesn't appear in Chrome or shows errors

**Solutions**:
1. **Check manifest.json syntax**:
```json
{
  "manifest_version": 3,
  "name": "Grok Prompt Enhancer",
  "version": "1.0.0",
  // ... rest of manifest
}
```

2. **Reload extension**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Reload" on the extension

3. **Check console errors**:
   - Right-click extension icon
   - Click "Inspect popup"
   - Check Console tab for errors

**Common Causes**:
- Invalid manifest.json
- Missing required permissions
- JavaScript syntax errors
- Missing icon files

#### 2. Extension Not Working on Grok
**Symptoms**: Extension loads but doesn't appear on grok.com

**Solutions**:
```javascript
// Check content script injection
console.log('Content script loaded on:', window.location.href);

// Verify selectors
const inputField = document.querySelector('textarea[name="prompt"]');
console.log('Input field found:', !!inputField);

// Check if script runs after DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing...');
});
```

**Common Causes**:
- Wrong URL matching in manifest
- Content script timing issues
- Grok's DOM structure changed
- CSP blocking script execution

#### 3. UI Not Appearing
**Symptoms**: Extension loads but enhancement UI doesn't show

**Solutions**:
```javascript
// Check if container exists
const container = document.getElementById('grok-enhancer-container');
console.log('Container exists:', !!container);

// Force re-initialization
if (window.grokEnhancer) {
  window.grokEnhancer.init();
}
```

**Common Causes**:
- CSS conflicts with Grok's styles
- Z-index issues
- JavaScript errors preventing UI creation
- DOM manipulation timing

#### 4. Settings Not Saving
**Symptoms**: Model selection doesn't persist

**Solutions**:
```javascript
// Check storage permissions
chrome.storage.sync.get('selectedModel', (data) => {
  console.log('Saved model:', data.selectedModel);
});

// Test storage write
chrome.storage.sync.set({ test: 'value' }, () => {
  console.log('Storage write successful');
});
```

**Common Causes**:
- Missing storage permission
- Chrome storage quota exceeded
- Incorrect storage API usage
- Popup script errors

### API Integration Issues

#### 1. Network Request Failures
**Symptoms**: `fetch` requests fail or timeout

**Solutions**:
```javascript
// Add timeout and retry logic
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

**Common Causes**:
- Network connectivity issues
- CORS policy violations
- Request timeout
- Server overload

#### 2. Response Parsing Errors
**Symptoms**: `JSON.parse` fails or unexpected response format

**Solutions**:
```javascript
// Safe response parsing
async function parseResponse(response) {
  try {
    const text = await response.text();
    console.log('Raw response:', text);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Response parsing error:', error);
    throw error;
  }
}
```

**Common Causes**:
- Non-JSON responses
- Malformed JSON
- Empty responses
- Encoding issues

### Performance Issues

#### 1. Slow Response Times
**Symptoms**: Enhancement takes too long

**Solutions**:
```javascript
// Add loading indicators
function showLoading() {
  const btn = document.getElementById('enhance-btn');
  btn.disabled = true;
  btn.textContent = 'Enhancing...';
}

function hideLoading() {
  const btn = document.getElementById('enhance-btn');
  btn.disabled = false;
  btn.textContent = 'Enhance Prompt';
}

// Optimize API calls
const debouncedEnhance = debounce(enhancePrompt, 300);
```

**Common Causes**:
- Large prompt size
- Network latency
- AI model processing time
- Server resource constraints

#### 2. Memory Leaks
**Symptoms**: Extension becomes slow over time

**Solutions**:
```javascript
// Clean up event listeners
function cleanup() {
  const container = document.getElementById('grok-enhancer-container');
  if (container) {
    container.remove();
  }
}

// Use WeakMap for event listeners
const listeners = new WeakMap();
```

**Common Causes**:
- Unremoved event listeners
- DOM elements not cleaned up
- Circular references
- Large data accumulation

## 🔧 Debugging Tools

### Chrome DevTools
```javascript
// Debug content script
console.log('Content script loaded');
debugger; // Add breakpoints

// Debug popup
// Right-click extension icon → Inspect popup

// Debug background script
// chrome://extensions → Find extension → background page
```

### Network Debugging
```javascript
// Log all network requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch request:', args);
  return originalFetch.apply(this, args);
};
```

### Error Tracking
```javascript
// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Unhandled promise rejection
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
```

## 📋 Testing Checklist

### Backend Testing
- [ ] Server starts without errors
- [ ] Health endpoint responds (`/health`)
- [ ] Enhancement endpoint works (`/enhance`)
- [ ] CORS headers are set correctly
- [ ] Error handling works properly
- [ ] API key validation works
- [ ] Rate limiting is respected

### Extension Testing
- [ ] Extension loads in Chrome
- [ ] Manifest.json is valid
- [ ] Content script injects on grok.com
- [ ] UI appears correctly
- [ ] Settings save and load
- [ ] Enhancement button works
- [ ] Error messages display properly
- [ ] Loading states work

### Integration Testing
- [ ] Extension communicates with backend
- [ ] Prompts are enhanced correctly
- [ ] Different models work
- [ ] Enhancement types work
- [ ] Error handling works end-to-end
- [ ] Performance is acceptable

## 🆘 Getting Help

### Debug Information to Collect
1. **Browser console logs**
2. **Network tab requests**
3. **Extension error messages**
4. **Backend server logs**
5. **Vercel function logs**
6. **Environment variable values** (without sensitive data)

### Useful Commands
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Vercel CLI
vercel --version

# List installed packages
npm list

# Check environment variables
echo $OPENROUTER_API_KEY

# Test API endpoint
curl -X GET https://your-backend.vercel.app/health
```

### Support Resources
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Express.js Documentation](https://expressjs.com/en/4x/api.html)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Stack Overflow](https://stackoverflow.com/) - Search for specific error messages

This troubleshooting guide should help resolve most issues encountered during development and deployment of the Grok Prompt Enhancer project. 