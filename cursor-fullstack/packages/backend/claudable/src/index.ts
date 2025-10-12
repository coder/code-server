import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketServer } from 'ws';
import { sessionRoutes } from './routes/session';
import { setupWebSocket } from './ws';
import { aiProviders } from './ai/providers';

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

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', sessionRoutes);

// AI Providers endpoint
app.get('/api/providers', (req, res) => {
  res.json({
    providers: [
      { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-3.5-turbo'] },
      { id: 'anthropic', name: 'Anthropic', models: ['claude-3-sonnet', 'claude-3-haiku'] },
      { id: 'google', name: 'Google Gemini', models: ['gemini-pro', 'gemini-pro-vision'] },
      { id: 'mistral', name: 'Mistral', models: ['mistral-large', 'mistral-medium'] }
    ]
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, provider, apiKey, model } = req.body;
    
    if (!message || !provider || !apiKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await aiProviders[provider].chat(message, apiKey, model);
    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
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