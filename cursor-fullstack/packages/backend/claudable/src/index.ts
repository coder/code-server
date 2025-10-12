import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketServer } from 'ws';
import { sessionRoutes } from './routes/session';
import { setupWebSocket } from './ws';
import { aiProviders } from './ai/providers';
import { ToolManager, executeTool, ToolSchemas } from './tools';
import { AIToolIntegration } from './ai/ai-tool-integration';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// WebSocket server for real-time communication
const wss = new WebSocketServer({ port: 8080 });

// Initialize tool manager and AI tool integration
const toolManager = new ToolManager();
const aiToolIntegration = new AIToolIntegration();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api', sessionRoutes);

// AI Providers endpoint
app.get('/api/providers', (req, res) => {
  res.json({
    providers: [
      { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'] },
      { id: 'anthropic', name: 'Anthropic', models: ['claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus'] },
      { id: 'google', name: 'Google Gemini', models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro'] },
      { id: 'mistral', name: 'Mistral', models: ['mistral-large', 'mistral-medium', 'mistral-small'] },
      { id: 'openrouter', name: 'OpenRouter', models: ['meta-llama/llama-2-70b-chat', 'meta-llama/llama-2-13b-chat', 'microsoft/wizardlm-13b', 'openai/gpt-4', 'anthropic/claude-3-sonnet'] }
    ]
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, provider, apiKey, model, useTools = false, conversationHistory = [] } = req.body;
    
    if (!message || !provider || !apiKey) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Please provide message, provider, and apiKey'
      });
    }

    if (!aiProviders[provider]) {
      return res.status(400).json({ 
        error: 'Invalid provider',
        details: `Provider '${provider}' is not supported`
      });
    }

    let response;
    if (useTools) {
      const result = await aiToolIntegration.chatWithTools(
        message, 
        provider, 
        apiKey, 
        model, 
        conversationHistory
      );
      response = result.response;
      if (result.toolResults) {
        res.json({ 
          response, 
          toolResults: result.toolResults,
          provider: provider,
          model: model || 'default'
        });
        return;
      }
    } else {
      response = await aiProviders[provider].chat(message, apiKey, model);
    }
    
    res.json({ 
      response,
      provider: provider,
      model: model || 'default'
    });
  } catch (error) {
    console.error('Chat error:', error);
    
    // More specific error handling
    if (error.message?.includes('API key')) {
      res.status(401).json({ 
        error: 'Invalid API key',
        details: 'Please check your API key and try again'
      });
    } else if (error.message?.includes('rate limit')) {
      res.status(429).json({ 
        error: 'Rate limit exceeded',
        details: 'Please wait before making another request'
      });
    } else if (error.message?.includes('quota')) {
      res.status(402).json({ 
        error: 'Quota exceeded',
        details: 'You have exceeded your API quota'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to process chat request',
        details: error.message || 'An unexpected error occurred'
      });
    }
  }
});

// Tool execution endpoint
app.post('/api/tools/execute', async (req, res) => {
  try {
    const { toolName, params } = req.body;
    
    if (!toolName) {
      return res.status(400).json({ error: 'Tool name is required' });
    }

    const result = await executeTool(toolName, params, toolManager);
    res.json(result);
  } catch (error) {
    console.error('Tool execution error:', error);
    res.status(500).json({ error: 'Failed to execute tool' });
  }
});

// Available tools endpoint
app.get('/api/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'file_read',
        description: 'Read contents of a file',
        parameters: ToolSchemas.fileRead.shape
      },
      {
        name: 'file_write',
        description: 'Write content to a file',
        parameters: ToolSchemas.fileWrite.shape
      },
      {
        name: 'file_list',
        description: 'List files in a directory',
        parameters: ToolSchemas.fileList.shape
      },
      {
        name: 'terminal_command',
        description: 'Execute a terminal command',
        parameters: ToolSchemas.terminalCommand.shape
      },
      {
        name: 'git_status',
        description: 'Get git status',
        parameters: ToolSchemas.gitStatus.shape
      },
      {
        name: 'git_commit',
        description: 'Commit changes to git',
        parameters: ToolSchemas.gitCommit.shape
      },
      {
        name: 'git_push',
        description: 'Push changes to remote repository',
        parameters: ToolSchemas.gitPush.shape
      },
      {
        name: 'git_pull',
        description: 'Pull changes from remote repository',
        parameters: ToolSchemas.gitPull.shape
      },
      {
        name: 'npm_install',
        description: 'Install npm packages',
        parameters: ToolSchemas.npmInstall.shape
      },
      {
        name: 'npm_run',
        description: 'Run npm script',
        parameters: ToolSchemas.npmRun.shape
      },
      {
        name: 'docker_build',
        description: 'Build Docker image',
        parameters: ToolSchemas.dockerBuild.shape
      },
      {
        name: 'docker_run',
        description: 'Run Docker container',
        parameters: ToolSchemas.dockerRun.shape
      },
      {
        name: 'search_code',
        description: 'Search for code patterns',
        parameters: ToolSchemas.searchCode.shape
      },
      {
        name: 'create_file',
        description: 'Create a new file',
        parameters: ToolSchemas.createFile.shape
      },
      {
        name: 'delete_file',
        description: 'Delete a file',
        parameters: ToolSchemas.deleteFile.shape
      },
      {
        name: 'create_directory',
        description: 'Create a new directory',
        parameters: ToolSchemas.createDirectory.shape
      },
      {
        name: 'move_file',
        description: 'Move/rename a file',
        parameters: ToolSchemas.moveFile.shape
      },
      {
        name: 'copy_file',
        description: 'Copy a file',
        parameters: ToolSchemas.copyFile.shape
      }
    ]
  });
});

// Terminal execution endpoint
app.post('/api/terminal', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const result = await toolManager.terminalCommand({ command });
    res.json(result);
  } catch (error) {
    console.error('Terminal execution error:', error);
    res.status(500).json({ error: 'Failed to execute terminal command' });
  }
});

// Code execution endpoint
app.post('/api/execute', async (req, res) => {
  try {
    const { file, content } = req.body;
    
    if (!file && !content) {
      return res.status(400).json({ error: 'File or content is required' });
    }

    // Determine file type and execute accordingly
    const filePath = file || 'temp_file';
    const fileContent = content || '';
    const extension = filePath.split('.').pop()?.toLowerCase();

    let command = '';
    switch (extension) {
      case 'js':
        command = `node -e "${fileContent.replace(/"/g, '\\"')}"`;
        break;
      case 'py':
        command = `python3 -c "${fileContent.replace(/"/g, '\\"')}"`;
        break;
      case 'ts':
        command = `npx ts-node -e "${fileContent.replace(/"/g, '\\"')}"`;
        break;
      case 'sh':
        command = `bash -c "${fileContent.replace(/"/g, '\\"')}"`;
        break;
      default:
        return res.status(400).json({ error: 'Unsupported file type for execution' });
    }

    const result = await toolManager.terminalCommand({ command });
    res.json(result);
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ error: 'Failed to execute code' });
  }
});

// Setup WebSocket handlers
setupWebSocket(io, wss);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🔌 WebSocket server running on port 8080`);
});

export { app, server, io, wss };