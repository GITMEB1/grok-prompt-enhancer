const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://grok.com',
    'chrome-extension://*',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validation middleware
function validateEnhancementRequest(req, res, next) {
  const { prompt, model, enhancementType } = req.body;
  
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid prompt',
      details: 'Prompt must be a non-empty string'
    });
  }
  
  if (!model || typeof model !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid model',
      details: 'Model must be a valid OpenRouter model identifier'
    });
  }
  
  if (!enhancementType || !['quick', 'advanced'].includes(enhancementType)) {
    return res.status(400).json({
      error: 'Missing or invalid enhancementType',
      details: 'EnhancementType must be either "quick" or "advanced"'
    });
  }
  
  if (prompt.length > 10000) {
    return res.status(400).json({
      error: 'Prompt too long',
      details: 'Prompt must be less than 10,000 characters'
    });
  }
  
  next();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0',
    openrouter: !!OPENROUTER_API_KEY
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Grok Prompt Enhancer API',
    version: '1.0.0',
    environment: NODE_ENV,
    endpoints: {
      health: 'GET /health',
      enhance: 'POST /enhance'
    },
    documentation: 'This API provides prompt enhancement services using OpenRouter models.',
    timestamp: new Date().toISOString()
  });
});
// Main enhancement endpoint
app.post('/enhance', validateEnhancementRequest, async (req, res) => {
  const { prompt, model, enhancementType } = req.body;
  
  // Check API key
  if (!OPENROUTER_API_KEY) {
    console.error('OpenRouter API key not configured');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'OpenRouter API key not configured'
    });
  }

  // Define system messages based on enhancement type
  const systemMessages = {
    quick: `You are a prompt enhancement expert. Rewrite the user's prompt to be:
1. Clearer and more specific
2. More likely to produce a helpful response
3. Concise but comprehensive
4. Well-structured and easy to understand

Focus on improving clarity and specificity while maintaining the original intent.`,
    
    advanced: `You are an advanced prompt enhancement expert. Analyze and enhance the user's prompt by:
1. Adding relevant context and background information when helpful
2. Breaking down complex questions into sub-questions if necessary
3. Ensuring the prompt leads to a deeper, more nuanced understanding
4. Making it more specific, actionable, and detailed
5. Considering potential edge cases or clarifications needed
6. Structuring the prompt for optimal AI response quality

Provide a comprehensive enhancement that maintains the original intent while significantly improving the prompt's effectiveness.`
  };

  try {
    console.log(`Enhancing prompt with ${model} (${enhancementType})`);
    
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: model,
      messages: [
        { role: 'system', content: systemMessages[enhancementType] },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://grok-prompt-enhancer.vercel.app',
        'X-Title': 'Grok Prompt Enhancer'
      },
      timeout: 30000 // 30 second timeout
    });

    const enhancedPrompt = response.data.choices[0].message.content;
    const usage = response.data.usage;
    
    console.log(`Successfully enhanced prompt. Tokens used: ${usage?.total_tokens || 'unknown'}`);
    
    res.json({
      enhancedPrompt,
      model: model,
      enhancementType: enhancementType,
      originalLength: prompt.length,
      enhancedLength: enhancedPrompt.length,
      usage: usage,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    
    // Handle different types of errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        return res.status(500).json({
          error: 'Authentication error',
          details: 'Invalid OpenRouter API key'
        });
      } else if (status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          details: 'Too many requests to OpenRouter API'
        });
      } else if (status === 400) {
        return res.status(400).json({
          error: 'Invalid request',
          details: data.error?.message || 'Bad request to OpenRouter API'
        });
      } else {
        return res.status(500).json({
          error: 'OpenRouter API error',
          details: data.error?.message || `HTTP ${status} error`
        });
      }
    } else if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        error: 'Request timeout',
        details: 'OpenRouter API request timed out'
      });
    } else if (error.code === 'ENOTFOUND') {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Cannot connect to OpenRouter API'
      });
    } else {
      return res.status(500).json({
        error: 'Internal server error',
        details: error.message
      });
    }
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    details: `Route ${req.method} ${req.originalUrl} does not exist`
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Grok Prompt Enhancer Backend running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Enhancement endpoint: http://localhost:${PORT}/enhance`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔑 OpenRouter API: ${OPENROUTER_API_KEY ? 'Configured' : 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app; 