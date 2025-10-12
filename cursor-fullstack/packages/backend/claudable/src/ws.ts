import { Server as SocketIOServer } from 'socket.io';
import { WebSocketServer } from 'ws';
import { aiProviders } from './ai/providers';

export function setupWebSocket(io: SocketIOServer, wss: WebSocketServer) {
  // Socket.IO for real-time communication
  io.on('connection', (socket) => {
    console.log('Client connected via Socket.IO:', socket.id);

    socket.on('chat-message', async (data) => {
      try {
        const { message, provider, apiKey, model } = data;
        
        if (!message || !provider || !apiKey) {
          socket.emit('chat-error', { error: 'Missing required fields' });
          return;
        }

        // Send typing indicator
        socket.emit('typing-start');

        // Get AI response
        const response = await aiProviders[provider].chat(message, apiKey, model);
        
        // Send response
        socket.emit('chat-response', { 
          response,
          provider,
          model 
        });

        // Stop typing indicator
        socket.emit('typing-stop');
      } catch (error) {
        console.error('WebSocket chat error:', error);
        socket.emit('chat-error', { error: 'Failed to process chat request' });
        socket.emit('typing-stop');
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Native WebSocket for additional real-time features
  wss.on('connection', (ws) => {
    console.log('Client connected via WebSocket');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'chat') {
          const { content, provider, apiKey, model } = message;
          
          if (!content || !provider || !apiKey) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              error: 'Missing required fields' 
            }));
            return;
          }

          // Send typing indicator
          ws.send(JSON.stringify({ type: 'typing-start' }));

          // Get AI response
          const response = await aiProviders[provider].chat(content, apiKey, model);
          
          // Send response
          ws.send(JSON.stringify({ 
            type: 'chat-response',
            response,
            provider,
            model
          }));

          // Stop typing indicator
          ws.send(JSON.stringify({ type: 'typing-stop' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          error: 'Failed to process message' 
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
}