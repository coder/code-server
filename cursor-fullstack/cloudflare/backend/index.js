// Cloudflare Worker for Cursor Full Stack AI IDE Backend
import { WebSocketDurableObject } from './websocket-do.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check endpoint
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT || 'production',
          version: '1.0.0'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // AI Providers endpoint
      if (url.pathname === '/api/providers') {
        return new Response(JSON.stringify({
          providers: [
            { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'] },
            { id: 'anthropic', name: 'Anthropic', models: ['claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus'] },
            { id: 'google', name: 'Google Gemini', models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro'] },
            { id: 'mistral', name: 'Mistral', models: ['mistral-large', 'mistral-medium', 'mistral-small'] },
            { id: 'openrouter', name: 'OpenRouter', models: ['meta-llama/llama-2-70b-chat', 'meta-llama/llama-2-13b-chat', 'microsoft/wizardlm-13b', 'openai/gpt-4', 'anthropic/claude-3-sonnet'] }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Chat endpoint
      if (url.pathname === '/api/chat' && request.method === 'POST') {
        const { message, provider, apiKey, model, useTools = false } = await request.json();
        
        if (!message || !provider || !apiKey) {
          return new Response(JSON.stringify({ 
            error: 'Missing required fields',
            details: 'Please provide message, provider, and apiKey'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        try {
          const response = await handleAIChat(message, provider, apiKey, model, useTools);
          return new Response(JSON.stringify({ 
            response,
            provider,
            model: model || 'default'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ 
            error: 'AI request failed',
            details: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Tools endpoint
      if (url.pathname === '/api/tools' && request.method === 'GET') {
        return new Response(JSON.stringify({
          tools: [
            { name: 'file_read', description: 'Read contents of a file', parameters: { filePath: { type: 'string' } } },
            { name: 'file_write', description: 'Write content to a file', parameters: { filePath: { type: 'string' }, content: { type: 'string' } } },
            { name: 'file_list', description: 'List files in a directory', parameters: { directory: { type: 'string' } } },
            { name: 'terminal_command', description: 'Execute a terminal command', parameters: { command: { type: 'string' } } },
            { name: 'git_status', description: 'Get git status', parameters: {} },
            { name: 'git_commit', description: 'Commit changes to git', parameters: { message: { type: 'string' } } },
            { name: 'search_code', description: 'Search for code patterns', parameters: { query: { type: 'string' } } },
            { name: 'create_file', description: 'Create a new file', parameters: { filePath: { type: 'string' }, content: { type: 'string' } } }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Tool execution endpoint
      if (url.pathname === '/api/tools/execute' && request.method === 'POST') {
        const { toolName, params } = await request.json();
        
        if (!toolName) {
          return new Response(JSON.stringify({ error: 'Tool name is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        try {
          const result = await executeTool(toolName, params, env);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ 
            error: 'Tool execution failed',
            details: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // File operations
      if (url.pathname.startsWith('/api/workspace/')) {
        return handleFileOperations(request, env, corsHeaders);
      }

      // WebSocket upgrade
      if (request.headers.get('Upgrade') === 'websocket') {
        const durableObjectId = env.WEBSOCKET_DO.idFromName('websocket');
        const durableObject = env.WEBSOCKET_DO.get(durableObjectId);
        return durableObject.fetch(request);
      }

      return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// AI Chat Handler
async function handleAIChat(message, provider, apiKey, model, useTools) {
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
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response generated';
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
      });
      
      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.content[0]?.text || 'No response generated';
    },
    
    google: async (message, apiKey, model) => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-pro'}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || 'No response generated';
    },
    
    mistral: async (message, apiKey, model) => {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'mistral-large-latest',
          messages: [{ role: 'user', content: message }],
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response generated';
    },
    
    openrouter: async (message, apiKey, model) => {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://cursor-fullstack-ai-ide.com',
          'X-Title': 'Cursor Full Stack AI IDE'
        },
        body: JSON.stringify({
          model: model || 'meta-llama/llama-2-70b-chat',
          messages: [{ role: 'user', content: message }],
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response generated';
    }
  };

  const providerHandler = providers[provider];
  if (!providerHandler) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  return await providerHandler(message, apiKey, model);
}

// Tool Execution Handler
async function executeTool(toolName, params, env) {
  const tools = {
    file_read: async (params) => {
      const { filePath } = params;
      const file = await env.FILE_STORAGE.get(filePath);
      return { success: true, content: file || '', filePath };
    },
    
    file_write: async (params) => {
      const { filePath, content } = params;
      await env.FILE_STORAGE.put(filePath, content);
      return { success: true, filePath };
    },
    
    file_list: async (params) => {
      const { directory = '' } = params;
      const files = await env.FILE_STORAGE.list({ prefix: directory });
      return { success: true, files: files.objects.map(obj => ({
        name: obj.key.split('/').pop(),
        path: obj.key,
        type: 'file',
        size: obj.size
      })) };
    },
    
    search_code: async (params) => {
      const { query } = params;
      const files = await env.FILE_STORAGE.list();
      const results = [];
      
      for (const file of files.objects) {
        const content = await env.FILE_STORAGE.get(file.key);
        if (content && content.includes(query)) {
          results.push({
            filePath: file.key,
            content: content.substring(0, 200) + '...'
          });
        }
      }
      
      return { success: true, results, query, count: results.length };
    },
    
    create_file: async (params) => {
      const { filePath, content } = params;
      await env.FILE_STORAGE.put(filePath, content);
      return { success: true, filePath };
    }
  };

  const tool = tools[toolName];
  if (!tool) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }

  try {
    return await tool(params);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// File Operations Handler
async function handleFileOperations(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/workspace/', '');
  
  if (request.method === 'GET' && path === 'files') {
    const files = await env.FILE_STORAGE.list();
    return new Response(JSON.stringify({
      files: files.objects.map(obj => ({
        name: obj.key.split('/').pop(),
        path: obj.key,
        type: 'file',
        size: obj.size
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  if (request.method === 'GET' && path) {
    const content = await env.FILE_STORAGE.get(path);
    if (!content) {
      return new Response('File not found', { 
        status: 404,
        headers: corsHeaders
      });
    }
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  if (request.method === 'POST' && path) {
    const { content } = await request.json();
    await env.FILE_STORAGE.put(path, content);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Not Found', { 
    status: 404,
    headers: corsHeaders
  });
}

// WebSocket Durable Object
export class WebSocketDurableObject {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    if (request.headers.get('Upgrade') === 'websocket') {
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);
      
      this.handleWebSocket(server);
      
      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }
    
    return new Response('Expected WebSocket', { status: 400 });
  }

  handleWebSocket(webSocket) {
    webSocket.accept();
    
    webSocket.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat') {
          const { content, provider, apiKey, model } = data;
          
          // Send typing indicator
          webSocket.send(JSON.stringify({ type: 'typing-start' }));
          
          try {
            const response = await handleAIChat(content, provider, apiKey, model);
            webSocket.send(JSON.stringify({ 
              type: 'chat-response',
              response,
              provider,
              model
            }));
          } catch (error) {
            webSocket.send(JSON.stringify({ 
              type: 'error',
              error: error.message
            }));
          }
          
          // Stop typing indicator
          webSocket.send(JSON.stringify({ type: 'typing-stop' }));
        }
      } catch (error) {
        webSocket.send(JSON.stringify({ 
          type: 'error',
          error: 'Invalid message format'
        }));
      }
    });
    
    webSocket.addEventListener('close', () => {
      console.log('WebSocket connection closed');
    });
  }
}