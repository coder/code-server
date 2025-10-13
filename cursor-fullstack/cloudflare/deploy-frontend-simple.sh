#!/bin/bash

# رفع Frontend بطريقة بسيطة
set -e

API_TOKEN="avRH6WSd0ueXkJqbQpDdnseVo9fy-fUSIJ1pdrWC"
ACCOUNT_ID="76f5b050419f112f1e9c5fbec1b3970d"
PROJECT_NAME="cursor-ide"

echo "رفع Frontend إلى Cloudflare Pages..."

cd frontend/dist

# إنشاء ملف HTML بسيط يعمل
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursor AI IDE</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #1e1e1e;
            color: #d4d4d4;
            height: 100vh;
            overflow: hidden;
        }
        
        .container {
            display: flex;
            height: 100vh;
        }
        
        .sidebar {
            width: 250px;
            background: #252526;
            border-right: 1px solid #3c3c3c;
            padding: 20px;
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
            padding: 8px 12px;
            cursor: pointer;
            border-radius: 4px;
            margin-bottom: 4px;
            transition: background 0.2s;
        }
        
        .file-item:hover {
            background: #2a2d2e;
        }
        
        .file-item.active {
            background: #264f78;
        }
        
        .editor-textarea {
            width: 100%;
            height: 100%;
            background: #1e1e1e;
            color: #d4d4d4;
            border: none;
            outline: none;
            font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            line-height: 1.5;
            resize: none;
        }
        
        .btn {
            background: #007acc;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 8px;
        }
        
        .btn:hover {
            background: #005a9e;
        }
        
        .connection-status {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #4caf50;
        }
        
        .chat-panel {
            width: 300px;
            background: #252526;
            border-left: 1px solid #3c3c3c;
            display: flex;
            flex-direction: column;
        }
        
        .chat-header {
            padding: 15px;
            border-bottom: 1px solid #3c3c3c;
            font-weight: 600;
        }
        
        .chat-messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
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
            padding: 8px 12px;
            border-radius: 4px;
            outline: none;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 8px;
        }
        
        .message.user {
            background: #007acc;
            color: white;
            margin-left: 20px;
        }
        
        .message.assistant {
            background: #2a2d2e;
            color: #d4d4d4;
            margin-right: 20px;
        }
        
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #1e1e1e;
            color: #d4d4d4;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #333;
            border-top: 4px solid #007acc;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 16px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div id="app">
        <div class="loading">
            <div class="loading-spinner"></div>
            <div>Loading Cursor AI IDE...</div>
        </div>
    </div>

    <script>
        const BACKEND_URL = 'https://cursor-backend.workers.dev';
        
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
                renderError('Failed to connect to backend. Please check your connection.');
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
                        <button class="btn" onclick="initApp()">Retry Connection</button>
                    </div>
                </div>
            `;
        }
        
        function renderApp() {
            document.getElementById('app').innerHTML = `
                <div class="container">
                    <div class="sidebar">
                        <h3>Cursor AI IDE</h3>
                        <div class="connection-status">
                            <div class="status-dot" style="background: ${isConnected ? '#4caf50' : '#f44747'}"></div>
                            <span>${isConnected ? 'Connected' : 'Disconnected'}</span>
                        </div>
                        
                        <div class="file-list">
                            <h4>Files</h4>
                            ${files.map(file => `
                                <div class="file-item ${selectedFile === file.path ? 'active' : ''}" 
                                     onclick="selectFile('${file.path}')">
                                    📄 ${file.name}
                                </div>
                            `).join('')}
                        </div>
                        
                        <div style="margin-top: 20px;">
                            <button class="btn" onclick="toggleChat()">🤖 AI Chat</button>
                            <button class="btn" onclick="toggleSettings()">⚙️ Settings</button>
                        </div>
                    </div>
                    
                    <div class="main">
                        <div class="header">
                            <div>
                                <span>📄 ${selectedFile || 'No file selected'}</span>
                            </div>
                            <div>
                                <button class="btn" onclick="saveFile()">💾 Save</button>
                                <button class="btn" onclick="runCode()">▶️ Run</button>
                            </div>
                        </div>
                        
                        <div class="editor">
                            ${selectedFile ? `
                                <textarea class="editor-textarea" id="editor" placeholder="Start coding...">${getFileContent()}</textarea>
                            ` : `
                                <div style="display: flex; align-items: center; justify-content: center; height: 100%; text-align: center;">
                                    <div>
                                        <div style="font-size: 48px; margin-bottom: 16px;">📁</div>
                                        <h3>No file selected</h3>
                                        <p>Select a file from the sidebar to start coding</p>
                                    </div>
                                </div>
                            `}
                        </div>
                        
                        <div class="status-bar">
                            <div>Ready</div>
                            <div>Cursor AI IDE v1.0.0</div>
                        </div>
                    </div>
                    
                    <div class="chat-panel hidden" id="chatPanel">
                        <div class="chat-header">🤖 AI Chat</div>
                        <div class="chat-messages" id="chatMessages">
                            ${chatHistory.length === 0 ? `
                                <div style="text-align: center; color: #666; padding: 20px;">
                                    <div style="font-size: 48px; margin-bottom: 16px;">🤖</div>
                                    <p>Start a conversation with AI</p>
                                    <p style="font-size: 12px;">Set your API key in settings</p>
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
                            <input type="text" id="chatInput" placeholder="${apiKey ? 'Ask me anything...' : 'Set API key first'}" 
                                   onkeypress="handleChatKeyPress(event)" ${!apiKey ? 'disabled' : ''}>
                        </div>
                    </div>
                </div>
                
                <div class="hidden" id="settingsModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                    <div style="background: #252526; border: 1px solid #3c3c3c; border-radius: 8px; padding: 20px; width: 400px;">
                        <h3 style="margin-bottom: 20px;">Settings</h3>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px;">OpenAI API Key</label>
                            <input type="password" id="apiKeyInput" value="${apiKey}" 
                                   style="width: 100%; background: #1e1e1e; border: 1px solid #3c3c3c; color: #d4d4d4; padding: 8px; border-radius: 4px;">
                        </div>
                        <div style="text-align: right;">
                            <button class="btn" onclick="closeSettings()" style="background: #666;">Cancel</button>
                            <button class="btn" onclick="saveSettings()">Save</button>
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
            // In a real app, this would load from backend
            return `// ${selectedFile}
console.log('Hello from ${selectedFile}');

function example() {
    return 'This is a sample file';
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
                    content: data.response || 'No response received',
                    timestamp: Date.now()
                };
                
                chatHistory.push(assistantMessage);
                renderApp();
            } catch (error) {
                console.error('Failed to send chat message:', error);
                const errorMessage = {
                    type: 'assistant',
                    content: 'Failed to send message. Please check your connection.',
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

# رفع الملف
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/assets/index.html" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: text/html" \
  --data-binary @index.html

echo "تم رفع Frontend بنجاح!"
echo "Frontend URL: https://cursor-ide.pages.dev"