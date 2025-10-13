// WebSocket Durable Object for Cloudflare Workers
export class WebSocketDurableObject {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
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
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, webSocket);
    
    // Send welcome message
    webSocket.send(JSON.stringify({
      type: 'connected',
      sessionId,
      timestamp: new Date().toISOString()
    }));
    
    webSocket.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat') {
          const { content, provider, apiKey, model } = data;
          
          // Send typing indicator
          webSocket.send(JSON.stringify({ type: 'typing-start' }));
          
          try {
            const response = await this.handleAIChat(content, provider, apiKey, model);
            webSocket.send(JSON.stringify({ 
              type: 'chat-response',
              response,
              provider,
              model,
              timestamp: new Date().toISOString()
            }));
          } catch (error) {
            webSocket.send(JSON.stringify({ 
              type: 'error',
              error: error.message,
              timestamp: new Date().toISOString()
            }));
          }
          
          // Stop typing indicator
          webSocket.send(JSON.stringify({ type: 'typing-stop' }));
        }
        
        if (data.type === 'tool-execute') {
          const { toolName, params } = data;
          
          try {
            const result = await this.executeTool(toolName, params);
            webSocket.send(JSON.stringify({
              type: 'tool-result',
              toolName,
              result,
              timestamp: new Date().toISOString()
            }));
          } catch (error) {
            webSocket.send(JSON.stringify({
              type: 'tool-error',
              toolName,
              error: error.message,
              timestamp: new Date().toISOString()
            }));
          }
        }
        
        if (data.type === 'file-operation') {
          const { operation, filePath, content } = data;
          
          try {
            const result = await this.handleFileOperation(operation, filePath, content);
            webSocket.send(JSON.stringify({
              type: 'file-result',
              operation,
              filePath,
              result,
              timestamp: new Date().toISOString()
            }));
          } catch (error) {
            webSocket.send(JSON.stringify({
              type: 'file-error',
              operation,
              filePath,
              error: error.message,
              timestamp: new Date().toISOString()
            }));
          }
        }
        
      } catch (error) {
        webSocket.send(JSON.stringify({ 
          type: 'error',
          error: 'Invalid message format',
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    webSocket.addEventListener('close', () => {
      this.sessions.delete(sessionId);
      console.log(`WebSocket session ${sessionId} closed`);
    });
    
    webSocket.addEventListener('error', (error) => {
      console.error(`WebSocket error for session ${sessionId}:`, error);
      this.sessions.delete(sessionId);
    });
  }

  async handleAIChat(message, provider, apiKey, model) {
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
            max_tokens: 1000,
            stream: false
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

  async executeTool(toolName, params) {
    const tools = {
      file_read: async (params) => {
        const { filePath } = params;
        const file = await this.env.FILE_STORAGE_KV.get(filePath);
        return { success: true, content: file || '', filePath };
      },
      
      file_write: async (params) => {
        const { filePath, content } = params;
        await this.env.FILE_STORAGE_KV.put(filePath, content);
        return { success: true, filePath };
      },
      
      file_list: async (params) => {
        const { directory = '' } = params;
        const files = await this.env.FILE_STORAGE_KV.list({ prefix: directory });
        return { success: true, files: files.objects.map(obj => ({
          name: obj.key.split('/').pop(),
          path: obj.key,
          type: 'file',
          size: obj.size
        })) };
      },
      
      search_code: async (params) => {
        const { query } = params;
        const files = await this.env.FILE_STORAGE_KV.list();
        const results = [];
        
        for (const file of files.objects) {
          const content = await this.env.FILE_STORAGE_KV.get(file.key);
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
        await this.env.FILE_STORAGE_KV.put(filePath, content);
        return { success: true, filePath };
      },
      
      delete_file: async (params) => {
        const { filePath } = params;
        await this.env.FILE_STORAGE_KV.delete(filePath);
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

  async handleFileOperation(operation, filePath, content) {
    switch (operation) {
      case 'read':
        const fileContent = await this.env.FILE_STORAGE_KV.get(filePath);
        return { success: true, content: fileContent || '', filePath };
      
      case 'write':
        await this.env.FILE_STORAGE_KV.put(filePath, content);
        return { success: true, filePath };
      
      case 'list':
        const files = await this.env.FILE_STORAGE_KV.list({ prefix: filePath });
        return { success: true, files: files.objects.map(obj => ({
          name: obj.key.split('/').pop(),
          path: obj.key,
          type: 'file',
          size: obj.size
        })) };
      
      case 'delete':
        await this.env.FILE_STORAGE_KV.delete(filePath);
        return { success: true, filePath };
      
      default:
        throw new Error(`Unknown file operation: ${operation}`);
    }
  }
}