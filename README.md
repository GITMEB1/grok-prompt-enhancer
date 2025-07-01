# Grok Prompt Enhancer

A Chrome extension that enhances prompts for the Grok web app with AI-powered improvements, featuring a Node.js backend service deployed on Vercel.

## 🚀 Quick Start

1. **Backend Setup**: Navigate to `backend/` and follow the setup instructions
2. **Extension Setup**: Load the `extension/` folder in Chrome Developer Mode
3. **Usage**: Visit [grok.com](https://grok.com) and use the "Enhance Prompt" button

## 📁 Project Structure

```
grok-prompt-enhancer/
├── backend/                 # Node.js Express server
│   ├── app.js              # Main server file
│   ├── package.json        # Dependencies
│   └── vercel.json         # Vercel deployment config
├── extension/              # Chrome extension
│   ├── manifest.json       # Extension manifest
│   ├── content.js          # Content script
│   ├── popup.html          # Settings popup
│   ├── popup.js            # Popup logic
│   └── icons/              # Extension icons
├── setup/                  # Codex setup files
│   ├── codex-setup.md      # Codex-specific instructions
│   ├── api-docs.md         # API documentation links
│   └── troubleshooting.md  # Common issues and solutions
└── README.md               # This file
```

## 🔧 API Documentation Links

### Core Technologies
- **[Express.js](https://expressjs.com/en/4x/api.html)** - Web framework for Node.js
- **[Axios](https://axios-http.com/docs/intro)** - HTTP client for API requests
- **[Chrome Extensions API](https://developer.chrome.com/docs/extensions/reference/)** - Extension development
- **[OpenRouter API](https://openrouter.ai/docs)** - AI model access

### Deployment & Hosting
- **[Vercel](https://vercel.com/docs)** - Serverless deployment platform
- **[GitHub](https://docs.github.com/en)** - Version control and repository hosting

### Development Tools
- **[Node.js](https://nodejs.org/api/)** - JavaScript runtime
- **[npm](https://docs.npmjs.com/)** - Package manager
- **[Chrome DevTools](https://developer.chrome.com/docs/devtools/)** - Extension debugging

## 🛠️ Features

- **Quick Enhancement**: Simple prompt rewrites for clarity
- **Advanced Enhancement**: Detailed analysis with context and sub-questions
- **Multiple AI Models**: Support for DeepSeek R1, Gemini 2.5, and GPT-4o
- **Real-time Processing**: Instant prompt enhancement via OpenRouter API
- **User-friendly Interface**: Seamless integration with Grok's UI

## 📋 Prerequisites

- Node.js 16+ and npm
- Chrome browser
- OpenRouter API key
- Vercel account (for deployment)

## 🔐 Environment Variables

```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
NODE_ENV=production
PORT=3000
```

## 📖 Detailed Setup

See the `setup/` directory for comprehensive setup instructions:
- `setup/codex-setup.md` - Codex-specific implementation guide
- `setup/api-docs.md` - Complete API documentation references
- `setup/troubleshooting.md` - Common issues and solutions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check `setup/troubleshooting.md`
2. Review API documentation in `setup/api-docs.md`
3. Open an issue on GitHub 