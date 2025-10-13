addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: 'production',
        version: '1.0.0',
        message: 'Backend is working!'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // AI Providers endpoint
    if (url.pathname === '/api/providers') {
      return new Response(JSON.stringify({
        providers: [
          { 
            id: 'openai', 
            name: 'OpenAI', 
            models: ['gpt-4', 'gpt-3.5-turbo'],
            description: 'Advanced AI models by OpenAI'
          },
          { 
            id: 'anthropic', 
            name: 'Anthropic', 
            models: ['claude-3-sonnet', 'claude-3-haiku'],
            description: 'Claude AI models by Anthropic'
          }
        ],
        total: 2
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Chat endpoint
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      const { message, provider, apiKey, model } = await request.json()
      
      if (!message || !provider || !apiKey) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields',
          details: 'Please provide message, provider, and apiKey'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      try {
        const response = await handleAIChat(message, provider, apiKey, model)
        return new Response(JSON.stringify({ 
          response,
          provider,
          model: model || 'default',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'AI request failed',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Tools endpoint
    if (url.pathname === '/api/tools' && request.method === 'GET') {
      return new Response(JSON.stringify({
        tools: [
          { 
            name: 'file_read', 
            description: 'Read contents of a file', 
            parameters: { filePath: { type: 'string', required: true } } 
          },
          { 
            name: 'file_write', 
            description: 'Write content to a file', 
            parameters: { 
              filePath: { type: 'string', required: true }, 
              content: { type: 'string', required: true } 
            } 
          }
        ],
        total: 2
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Workspace files endpoint
    if (url.pathname === '/api/workspace/files' && request.method === 'GET') {
      return new Response(JSON.stringify({
        files: [
          { name: 'index.html', path: 'index.html', type: 'file', size: 1024 },
          { name: 'app.js', path: 'app.js', type: 'file', size: 2048 },
          { name: 'style.css', path: 'style.css', type: 'file', size: 512 },
          { name: 'README.md', path: 'README.md', type: 'file', size: 256 }
        ],
        total: 4
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Default response
    return new Response(JSON.stringify({
      message: 'Cursor AI IDE Backend',
      version: '1.0.0',
      status: 'running',
      endpoints: [
        'GET /health - Health check',
        'GET /api/providers - AI providers list',
        'POST /api/chat - AI chat endpoint',
        'GET /api/tools - Available tools',
        'GET /api/workspace/files - Workspace files'
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// AI Chat Handler
async function handleAIChat(message, provider, apiKey, model) {
  const providers = {
    openai: async (message, apiKey, model) => {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'gpt-4',
          messages: [{ role: 'user', content: message }],
          max_tokens: 1000
        })
      })
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }
      
      const data = await response.json()
      return data.choices[0]?.message?.content || 'No response generated'
    },
    
    anthropic: async (message, apiKey, model) => {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model || 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [{ role: 'user', content: message }]
        })
      })
      
      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`)
      }
      
      const data = await response.json()
      return data.content[0]?.text || 'No response generated'
    }
  }

  const providerHandler = providers[provider]
  if (!providerHandler) {
    throw new Error(`Unsupported provider: ${provider}`)
  }

  return await providerHandler(message, apiKey, model)
}
