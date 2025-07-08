const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
const corsOptions = {
  origin: [
    'https://grok.com',
    'chrome-extension://*',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Custom middleware to ensure CORS headers are always set
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://grok.com');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Fixed model for all enhancements - DeepSeek R1
const ENHANCEMENT_MODEL = 'deepseek/deepseek-r1';

// Validation middleware
function validateEnhancementRequest(req, res, next) {
  const { prompt, mode, enhancementType } = req.body;
  
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid prompt',
      details: 'Prompt must be a non-empty string'
    });
  }
  
  // Support both new mode system and legacy enhancementType for backward compatibility
  const requestMode = mode || enhancementType;
  const validModes = ['deep-research', 'think-mode', 'quick-refine', 'quick', 'advanced'];
  
  if (!requestMode || !validModes.includes(requestMode)) {
    return res.status(400).json({
      error: 'Missing or invalid mode',
      details: 'Mode must be one of: deep-research, think-mode, quick-refine'
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
    version: '2.0.0',
    openrouter: !!OPENROUTER_API_KEY,
    enhancement_model: ENHANCEMENT_MODEL,
    message: 'Grok Prompt Enhancer API v2.0 - Now supporting Grok 3 modes'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Grok Prompt Enhancer API v2.0',
    version: '2.0.0',
    environment: NODE_ENV,
    enhancement_model: ENHANCEMENT_MODEL,
    supported_modes: ['deep-research', 'think-mode', 'quick-refine'],
    endpoints: {
      health: 'GET /health',
      enhance: 'POST /enhance'
    },
    description: 'This API enhances prompts for optimal use with Grok 3\'s specialized modes using DeepSeek R1.',
    timestamp: new Date().toISOString()
  });
});

// Main enhancement endpoint
app.post('/enhance', validateEnhancementRequest, async (req, res) => {
  const { prompt, mode, enhancementType, modeInfo } = req.body;
  
  // Determine the enhancement mode (support legacy and new systems)
  const enhancementMode = mode || enhancementType;
  
  // Map legacy modes to new modes
  const modeMapping = {
    'quick': 'quick-refine',
    'advanced': 'think-mode'
  };
  const actualMode = modeMapping[enhancementMode] || enhancementMode;
  
  // Check API key
  if (!OPENROUTER_API_KEY) {
    console.error('OpenRouter API key not configured');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'OpenRouter API key not configured'
    });
  }

  // Define system messages optimized for each Grok 3 mode
  const systemMessages = {
    'deep-research': `You are a prompt optimization expert specializing in Grok 3's Deep Research mode. Your task is to rewrite prompts to maximize the effectiveness of Grok 3's research capabilities.

Grok 3's Deep Research mode excels at:
- Real-time web search and data synthesis
- Multi-source information gathering
- Comprehensive analysis with citations
- Fact-checking and verification
- Trend analysis and current events

Transform the user's prompt to:
1. Clearly specify what type of research is needed
2. Request multiple sources and perspectives
3. Ask for recent/current information when relevant
4. Request citations and source verification
5. Structure the query for comprehensive analysis
6. Include requests for data synthesis and conclusions

Output only the enhanced prompt, optimized for Grok 3's Deep Research capabilities.`,

    'think-mode': `You are a prompt optimization expert specializing in Grok 3's Think Mode. Your task is to rewrite prompts to maximize the effectiveness of Grok 3's advanced reasoning capabilities.

Grok 3's Think Mode excels at:
- Step-by-step logical reasoning
- Complex problem decomposition
- Multi-step analysis and inference
- Critical thinking and evaluation
- Connecting disparate concepts
- Detailed explanations of reasoning processes

Transform the user's prompt to:
1. Request explicit step-by-step reasoning
2. Ask for problem breakdown and analysis
3. Encourage critical evaluation of different approaches
4. Request explanation of reasoning processes
5. Ask for consideration of multiple perspectives
6. Structure for logical flow and clear conclusions

Output only the enhanced prompt, optimized for Grok 3's Think Mode reasoning capabilities.`,

    'quick-refine': `You are a prompt optimization expert focused on creating clear, effective prompts for immediate results. Your task is to enhance prompts for optimal clarity and effectiveness while maintaining efficiency.

Transform the user's prompt to:
1. Make it more specific and focused
2. Remove ambiguity and unclear language
3. Add necessary context for better understanding
4. Structure it for clear, actionable responses
5. Ensure it's concise but comprehensive
6. Optimize for quick, high-quality results

Keep the enhancement efficient - improve clarity, specificity, and effectiveness without over-complicating.

Output only the enhanced prompt, optimized for clear and effective results.`
  };

  try {
    console.log(`Enhancing prompt for Grok 3 ${actualMode} mode using ${ENHANCEMENT_MODEL}`);
    
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: ENHANCEMENT_MODEL,
      messages: [
        { role: 'system', content: systemMessages[actualMode] },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://grok-prompt-enhancer.vercel.app',
        'X-Title': 'Grok Prompt Enhancer v2.0'
      },
      timeout: 45000 // 45 second timeout for DeepSeek R1
    });

    const enhancedPrompt = response.data.choices[0].message.content;
    const usage = response.data.usage;
    
    console.log(`Successfully enhanced prompt for ${actualMode} mode. Tokens used: ${usage?.total_tokens || 'unknown'}`);
    
    res.json({
      enhancedPrompt,
      mode: actualMode,
      enhancementModel: ENHANCEMENT_MODEL,
      originalLength: prompt.length,
      enhancedLength: enhancedPrompt.length,
      usage: usage,
      grokMode: {
        name: actualMode,
        description: getGrokModeDescription(actualMode)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Enhancement error:', error.response?.data || error.message);
    
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
          details: 'Too many requests to OpenRouter API. Please try again in a moment.'
        });
      } else if (status === 400) {
        return res.status(400).json({
          error: 'Invalid request',
          details: data.error?.message || 'Bad request to OpenRouter API'
        });
      } else if (status === 503) {
        return res.status(503).json({
          error: 'Model temporarily unavailable',
          details: 'DeepSeek R1 is temporarily unavailable. Please try again.'
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
        details: 'Enhancement request timed out. DeepSeek R1 may be processing slowly.'
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

// Helper function to get Grok mode descriptions
function getGrokModeDescription(mode) {
  const descriptions = {
    'deep-research': 'Comprehensive research with real-time web data and multi-source analysis',
    'think-mode': 'Advanced step-by-step reasoning and logical problem solving',
    'quick-refine': 'Fast and effective prompt optimization for immediate results'
  };
  return descriptions[mode] || 'Enhanced prompt optimization';
}

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
  console.log(`🚀 Grok Prompt Enhancer Backend v2.0 running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Enhancement endpoint: http://localhost:${PORT}/enhance`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🤖 Enhancement model: ${ENHANCEMENT_MODEL}`);
  console.log(`🔑 OpenRouter API: ${OPENROUTER_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`🎯 Supported modes: deep-research, think-mode, quick-refine`);
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