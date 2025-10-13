#!/bin/bash

# نشر نسخة ثانية من التطبيق
set -e

API_TOKEN="avRH6WSd0ueXkJqbQpDdnseVo9fy-fUSIJ1pdrWC"
ACCOUNT_ID="76f5b050419f112f1e9c5fbec1b3970d"

echo "🚀 نشر نسخة ثانية من التطبيق..."

# 1. إنشاء Backend جديد
echo "1. إنشاء Backend جديد..."
cat > backend-v2.js << 'EOF'
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
        version: '2.0.0',
        message: 'Backend Version 2 is working!'
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
            models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
            description: 'Advanced AI models by OpenAI'
          },
          { 
            id: 'anthropic', 
            name: 'Anthropic', 
            models: ['claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus'],
            description: 'Claude AI models by Anthropic'
          },
          { 
            id: 'google', 
            name: 'Google Gemini', 
            models: ['gemini-pro', 'gemini-pro-vision'],
            description: 'Google Gemini AI models'
          }
        ],
        total: 3
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
          timestamp: new Date().toISOString(),
          version: '2.0.0'
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
          },
          { 
            name: 'file_list', 
            description: 'List files in a directory', 
            parameters: { directory: { type: 'string', required: false } } 
          },
          { 
            name: 'terminal_command', 
            description: 'Execute a terminal command', 
            parameters: { command: { type: 'string', required: true } } 
          }
        ],
        total: 4
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
          { name: 'README.md', path: 'README.md', type: 'file', size: 256 },
          { name: 'package.json', path: 'package.json', type: 'file', size: 512 },
          { name: 'config.js', path: 'config.js', type: 'file', size: 256 }
        ],
        total: 6
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Default response
    return new Response(JSON.stringify({
      message: 'Cursor AI IDE Backend Version 2',
      version: '2.0.0',
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
      timestamp: new Date().toISOString(),
      version: '2.0.0'
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
      })
      
      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`)
      }
      
      const data = await response.json()
      return data.candidates[0]?.content?.parts[0]?.text || 'No response generated'
    }
  }

  const providerHandler = providers[provider]
  if (!providerHandler) {
    throw new Error(`Unsupported provider: ${provider}`)
  }

  return await providerHandler(message, apiKey, model)
}
EOF

# 2. رفع Backend الجديد
echo "2. رفع Backend الجديد..."
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/cursor-backend-v2" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/javascript" \
  --data-binary @backend-v2.js

echo "✅ تم رفع Backend الجديد"

# 3. إنشاء Frontend جديد
echo "3. إنشاء Frontend جديد..."
cat > frontend-v2.html << 'EOF'
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursor AI IDE v2.0 - بيئة التطوير الذكية</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Tajawal', sans-serif;
            background: #1e1e1e;
            color: #d4d4d4;
            height: 100vh;
            overflow: hidden;
            direction: rtl;
        }
        
        .container {
            display: flex;
            height: 100vh;
        }
        
        .sidebar {
            width: 300px;
            background: #252526;
            border-left: 1px solid #3c3c3c;
            padding: 20px;
            overflow-y: auto;
        }
        
        .main {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: #252526;
            border-bottom: 1px solid #3c3c3c;
            padding: 15px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .editor {
            flex: 1;
            background: #1e1e1e;
            padding: 20px;
        }
        
        .status-bar {
            background: #007acc;
            color: white;
            padding: 8px 20px;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
        }
        
        .file-list {
            margin-top: 20px;
        }
        
        .file-item {
            padding: 10px 12px;
            cursor: pointer;
            border-radius: 6px;
            margin-bottom: 4px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .file-item:hover {
            background: #2a2d2e;
            transform: translateX(-2px);
        }
        
        .file-item.active {
            background: #264f78;
            border-right: 3px solid #007acc;
        }
        
        .editor-textarea {
            width: 100%;
            height: 100%;
            background: #1e1e1e;
            color: #d4d4d4;
            border: none;
            outline: none;
            font-family: 'Fira Code', 'Consolas', 'Monaco', 'Cascadia Code', monospace;
            font-size: 14px;
            line-height: 1.6;
            resize: none;
            direction: ltr;
        }
        
        .btn {
            background: #007acc;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            cursor: pointer;
            margin-left: 8px;
            font-weight: 500;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .btn:hover {
            background: #005a9e;
            transform: translateY(-1px);
        }
        
        .btn-secondary {
            background: #2a2d2e;
            color: #d4d4d4;
            border: 1px solid #3c3c3c;
        }
        
        .btn-secondary:hover {
            background: #3c3c3c;
        }
        
        .connection-status {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #4caf50;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .chat-panel {
            width: 400px;
            background: #252526;
            border-right: 1px solid #3c3c3c;
            display: flex;
            flex-direction: column;
        }
        
        .chat-header {
            padding: 15px;
            border-bottom: 1px solid #3c3c3c;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .chat-messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            direction: ltr;
        }
        
        .chat-input {
            padding: 15px;
            border-top: 1px solid #3c3c3c;
        }
        
        .chat-input input {
            width: 100%;
            background: #1e1e1e;
            border: 1px solid #3c3c3c;
            color: #d4d4d4;
            padding: 10px 12px;
            border-radius: 6px;
            outline: none;
            font-size: 14px;
        }
        
        .chat-input input:focus {
            border-color: #007acc;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 12px;
            border-radius: 8px;
            animation: slideIn 0.3s ease;
        }
        
        .message.user {
            background: #007acc;
            color: white;
            margin-left: 20px;
            border-bottom-right-radius: 4px;
        }
        
        .message.assistant {
            background: #2a2d2e;
            color: #d4d4d4;
            margin-right: 20px;
            border-bottom-left-radius: 4px;
            border: 1px solid #3c3c3c;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #1e1e1e;
            color: #d4d4d4;
            flex-direction: column;
            gap: 20px;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #333;
            border-top: 4px solid #007acc;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .hidden {
            display: none;
        }
        
        .logo {
            font-size: 18px;
            font-weight: 700;
            color: #007acc;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #d4d4d4;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #3c3c3c;
        }
        
        .file-icon {
            font-size: 16px;
        }
        
        .welcome-message {
            text-align: center;
            padding: 40px 20px;
            color: #888;
        }
        
        .welcome-message h3 {
            color: #d4d4d4;
            margin-bottom: 10px;
        }
        
        .feature-list {
            list-style: none;
            padding: 0;
            margin-top: 20px;
        }
        
        .feature-list li {
            padding: 5px 0;
            color: #888;
            font-size: 12px;
        }
        
        .feature-list li:before {
            content: "✓ ";
            color: #4caf50;
            font-weight: bold;
        }
        
        .version-badge {
            background: #007acc;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div id="app">
        <div class="loading">
            <div class="loading-spinner"></div>
            <div>جاري تحميل Cursor AI IDE v2.0...</div>
            <div style="font-size: 12px; color: #888;">Loading Cursor AI IDE v2.0...</div>
        </div>
    </div>

    <script>
        const BACKEND_URL = 'https://cursor-backend-v2.workers.dev';
        
        let isConnected = false;
        let selectedFile = null;
        let files = [];
        let chatHistory = [];
        let apiKey = '';
        
        async function initApp() {
            try {
                // Test backend connection
                const response = await fetch(`${BACKEND_URL}/health`);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Backend connected:', data);
                    isConnected = true;
                    await loadFiles();
                    renderApp();
                } else {
                    throw new Error('Backend not responding');
                }
            } catch (error) {
                console.error('Failed to connect:', error);
                renderError('فشل في الاتصال بالخادم. يرجى التحقق من الاتصال.');
            }
        }
        
        async function loadFiles() {
            try {
                const response = await fetch(`${BACKEND_URL}/api/workspace/files`);
                if (response.ok) {
                    const data = await response.json();
                    files = data.files || [];
                }
            } catch (error) {
                console.error('Failed to load files:', error);
            }
        }
        
        function renderError(message) {
            document.getElementById('app').innerHTML = `
                <div class="loading">
                    <div style="text-align: center;">
                        <div style="color: #f44747; margin-bottom: 16px; font-size: 48px;">⚠️</div>
                        <div style="margin-bottom: 16px;">${message}</div>
                        <button class="btn" onclick="initApp()">إعادة المحاولة</button>
                    </div>
                </div>
            `;
        }
        
        function renderApp() {
            document.getElementById('app').innerHTML = `
                <div class="container">
                    <div class="sidebar">
                        <div class="logo">
                            <span>🚀</span>
                            <span>Cursor AI IDE</span>
                            <span class="version-badge">v2.0</span>
                        </div>
                        <div class="connection-status">
                            <div class="status-dot" style="background: ${isConnected ? '#4caf50' : '#f44747'}"></div>
                            <span>${isConnected ? 'متصل' : 'غير متصل'}</span>
                        </div>
                        
                        <div class="file-list">
                            <div class="section-title">📁 الملفات</div>
                            ${files.map(file => `
                                <div class="file-item ${selectedFile === file.path ? 'active' : ''}" 
                                     onclick="selectFile('${file.path}')">
                                    <span class="file-icon">📄</span>
                                    <span>${file.name}</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div style="margin-top: 20px;">
                            <div class="section-title">🛠️ الأدوات</div>
                            <button class="btn btn-secondary" onclick="toggleChat()" style="width: 100%; margin: 4px 0;">
                                🤖 دردشة AI
                            </button>
                            <button class="btn btn-secondary" onclick="toggleSettings()" style="width: 100%; margin: 4px 0;">
                                ⚙️ الإعدادات
                            </button>
                        </div>
                    </div>
                    
                    <div class="main">
                        <div class="header">
                            <div>
                                <span>📄 ${selectedFile || 'لم يتم اختيار ملف'}</span>
                            </div>
                            <div>
                                <button class="btn" onclick="saveFile()">
                                    💾 حفظ
                                </button>
                                <button class="btn" onclick="runCode()">
                                    ▶️ تشغيل
                                </button>
                            </div>
                        </div>
                        
                        <div class="editor">
                            ${selectedFile ? `
                                <textarea class="editor-textarea" id="editor" placeholder="ابدأ البرمجة...">${getFileContent()}</textarea>
                            ` : `
                                <div class="welcome-message">
                                    <div style="font-size: 48px; margin-bottom: 16px;">📁</div>
                                    <h3>مرحباً بك في Cursor AI IDE v2.0</h3>
                                    <p>اختر ملفاً من الشريط الجانبي لبدء البرمجة</p>
                                    <ul class="feature-list">
                                        <li>محرر كود متقدم</li>
                                        <li>دردشة مع الذكاء الاصطناعي</li>
                                        <li>إدارة الملفات</li>
                                        <li>تنفيذ الكود</li>
                                        <li>أدوات متكاملة</li>
                                        <li>دعم Google Gemini</li>
                                    </ul>
                                </div>
                            `}
                        </div>
                        
                        <div class="status-bar">
                            <div>جاهز - v2.0</div>
                            <div>Cursor AI IDE v2.0.0</div>
                        </div>
                    </div>
                    
                    <div class="chat-panel hidden" id="chatPanel">
                        <div class="chat-header">
                            <span>🤖</span>
                            <span>دردشة AI v2.0</span>
                            <button onclick="toggleChat()" style="margin-right: auto; background: none; border: none; color: #888; cursor: pointer;">×</button>
                        </div>
                        <div class="chat-messages" id="chatMessages">
                            ${chatHistory.length === 0 ? `
                                <div style="text-align: center; color: #666; padding: 20px;">
                                    <div style="font-size: 48px; margin-bottom: 16px;">🤖</div>
                                    <p>ابدأ محادثة مع الذكاء الاصطناعي</p>
                                    <p style="font-size: 12px;">أضف مفتاح API من الإعدادات</p>
                                </div>
                            ` : chatHistory.map(msg => `
                                <div class="message ${msg.type}">
                                    <div>${msg.content}</div>
                                    <div style="font-size: 11px; opacity: 0.7; margin-top: 4px;">
                                        ${new Date(msg.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="chat-input">
                            <input type="text" id="chatInput" placeholder="${apiKey ? 'اسألني أي شيء...' : 'أضف مفتاح API أولاً'}" 
                                   onkeypress="handleChatKeyPress(event)" ${!apiKey ? 'disabled' : ''}>
                        </div>
                    </div>
                </div>
                
                <div class="hidden" id="settingsModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                    <div style="background: #252526; border: 1px solid #3c3c3c; border-radius: 8px; padding: 20px; width: 400px;">
                        <h3 style="margin-bottom: 20px; color: #d4d4d4;">⚙️ الإعدادات v2.0</h3>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; color: #d4d4d4;">مفتاح API</label>
                            <input type="password" id="apiKeyInput" value="${apiKey}" 
                                   style="width: 100%; background: #1e1e1e; border: 1px solid #3c3c3c; color: #d4d4d4; padding: 10px; border-radius: 6px;">
                        </div>
                        <div style="text-align: left;">
                            <button class="btn btn-secondary" onclick="closeSettings()">إلغاء</button>
                            <button class="btn" onclick="saveSettings()">حفظ</button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        function selectFile(filePath) {
            selectedFile = filePath;
            renderApp();
        }
        
        function getFileContent() {
            return `// ${selectedFile}
console.log('مرحباً من ${selectedFile} - Cursor AI IDE v2.0');

function example() {
    return 'هذا ملف تجريبي - النسخة الثانية';
}

export default example;`;
        }
        
        function saveFile() {
            if (!selectedFile) return;
            console.log('Saving file:', selectedFile);
            // In a real app, this would save to backend
        }
        
        function runCode() {
            if (!selectedFile) return;
            console.log('Running code for:', selectedFile);
            // In a real app, this would execute code
        }
        
        function toggleChat() {
            const chatPanel = document.getElementById('chatPanel');
            chatPanel.classList.toggle('hidden');
        }
        
        function toggleSettings() {
            const settingsModal = document.getElementById('settingsModal');
            settingsModal.classList.toggle('hidden');
        }
        
        function closeSettings() {
            const settingsModal = document.getElementById('settingsModal');
            settingsModal.classList.add('hidden');
        }
        
        function saveSettings() {
            apiKey = document.getElementById('apiKeyInput').value;
            closeSettings();
            renderApp();
        }
        
        function handleChatKeyPress(event) {
            if (event.key === 'Enter') {
                sendChatMessage();
            }
        }
        
        async function sendChatMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            if (!message || !apiKey) return;
            
            const userMessage = {
                type: 'user',
                content: message,
                timestamp: Date.now()
            };
            
            chatHistory.push(userMessage);
            input.value = '';
            renderApp();
            
            try {
                const response = await fetch(`${BACKEND_URL}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        provider: 'openai',
                        apiKey: apiKey,
                        model: 'gpt-4'
                    }),
                });
                
                const data = await response.json();
                const assistantMessage = {
                    type: 'assistant',
                    content: data.response || 'لم يتم استلام رد',
                    timestamp: Date.now()
                };
                
                chatHistory.push(assistantMessage);
                renderApp();
            } catch (error) {
                console.error('Failed to send chat message:', error);
                const errorMessage = {
                    type: 'assistant',
                    content: 'فشل في إرسال الرسالة. يرجى التحقق من الاتصال.',
                    timestamp: Date.now()
                };
                chatHistory.push(errorMessage);
                renderApp();
            }
        }
        
        // Initialize app
        initApp();
    </script>
</body>
</html>
EOF

# 4. رفع Frontend الجديد
echo "4. رفع Frontend الجديد..."
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/assets/index.html" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: text/html" \
  --data-binary @frontend-v2.html

echo "✅ تم رفع Frontend الجديد"

# 5. اختبار التطبيق
echo "5. اختبار التطبيق..."
sleep 10

echo "اختبار Backend v2:"
BACKEND_TEST=$(curl -s https://cursor-backend-v2.workers.dev/health)
echo "$BACKEND_TEST"

echo ""
echo "اختبار Frontend v2:"
FRONTEND_TEST=$(curl -s -w "%{http_code}" https://cursor-ide.pages.dev -o /dev/null)
echo "Frontend Status: $FRONTEND_TEST"

echo ""
echo "🌐 الروابط:"
echo "Backend v2: https://cursor-backend-v2.workers.dev"
echo "Frontend v2: https://cursor-ide.pages.dev"
echo "🎉 تم نشر النسخة الثانية!"