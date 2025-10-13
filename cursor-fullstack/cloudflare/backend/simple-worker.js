// Cloudflare Worker - نسخة مبسطة
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
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
          environment: 'production',
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