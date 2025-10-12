import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, X } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  provider?: string;
}

interface ChatAssistantProps {
  socket: WebSocket | null;
  apiKeys: Record<string, string>;
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  backendUrl: string;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  socket,
  apiKeys,
  selectedProvider,
  onProviderChange,
  backendUrl
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'chat-response') {
            const newMessage: Message = {
              id: Date.now().toString(),
              type: 'assistant',
              content: data.response,
              timestamp: new Date(),
              provider: data.provider
            };
            setMessages(prev => [...prev, newMessage]);
            setIsTyping(false);
          } else if (data.type === 'typing-start') {
            setIsTyping(true);
          } else if (data.type === 'typing-stop') {
            setIsTyping(false);
          } else if (data.type === 'error') {
            const errorMessage: Message = {
              id: Date.now().toString(),
              type: 'assistant',
              content: `Error: ${data.error}`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsTyping(false);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    }
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || !apiKeys[selectedProvider]) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    if (socket && socket.readyState === WebSocket.OPEN) {
      // Send via WebSocket
      socket.send(JSON.stringify({
        type: 'chat',
        content: input,
        provider: selectedProvider,
        apiKey: apiKeys[selectedProvider],
        model: getModelForProvider(selectedProvider)
      }));
    } else {
      // Fallback to HTTP API
      try {
        const response = await fetch(`${backendUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: input,
            provider: selectedProvider,
            apiKey: apiKeys[selectedProvider],
            model: getModelForProvider(selectedProvider)
          }),
        });

        const data = await response.json();
        const assistantMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          provider: selectedProvider
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Failed to send message:', error);
        const errorMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: 'Failed to send message. Please check your connection.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  const getModelForProvider = (provider: string) => {
    const models: Record<string, string> = {
      openai: 'gpt-4',
      anthropic: 'claude-3-sonnet-20240229',
      google: 'gemini-pro',
      mistral: 'mistral-large-latest',
      openrouter: 'meta-llama/llama-2-70b-chat'
    };
    return models[provider] || 'gpt-4';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="h-80 border-t border-cursor-border bg-cursor-sidebar flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 border-b border-cursor-border">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-cursor-accent" />
          <span className="font-semibold">AI Assistant</span>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${socket?.readyState === WebSocket.OPEN ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-400">
              {socket?.readyState === WebSocket.OPEN ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedProvider}
            onChange={(e) => onProviderChange(e.target.value)}
            className="bg-cursor-bg border border-cursor-border rounded px-2 py-1 text-sm"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google Gemini</option>
            <option value="mistral">Mistral</option>
            <option value="openrouter">OpenRouter</option>
          </select>
          <button
            onClick={clearChat}
            className="p-1 hover:bg-cursor-hover rounded"
            title="Clear chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Start a conversation with the AI assistant</p>
            <p className="text-sm">Make sure to set your API key in settings</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-cursor-accent text-white'
                  : 'bg-cursor-bg border border-cursor-border'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'assistant' && (
                  <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                {message.type === 'user' && (
                  <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.provider && (
                      <span className="text-xs opacity-70">
                        via {message.provider}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-cursor-bg border border-cursor-border rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-cursor-border">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              apiKeys[selectedProvider] 
                ? "Ask me anything..." 
                : "Please set your API key in settings first"
            }
            disabled={!apiKeys[selectedProvider]}
            className="flex-1 bg-cursor-bg border border-cursor-border rounded px-3 py-2 text-sm focus:outline-none focus:border-cursor-accent disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !apiKeys[selectedProvider] || isTyping}
            className="bg-cursor-accent text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};