const axios = require('axios');
const WebSocket = require('ws');

const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5173';
const WS_URL = 'ws://localhost:8080';

async function testSystem() {
  console.log('🧪 Testing Cursor Full Stack AI IDE...\n');

  // Test 1: Backend API
  try {
    console.log('1. Testing Backend API...');
    const response = await axios.get(`${BACKEND_URL}/api/providers`);
    console.log('✅ Backend API is responding');
    console.log(`   Available providers: ${response.data.providers.map(p => p.name).join(', ')}`);
  } catch (error) {
    console.log('❌ Backend API failed:', error.message);
  }

  // Test 2: Tools API
  try {
    console.log('\n2. Testing Tools API...');
    const response = await axios.get(`${BACKEND_URL}/api/tools`);
    console.log('✅ Tools API is responding');
    console.log(`   Available tools: ${response.data.tools.length}`);
  } catch (error) {
    console.log('❌ Tools API failed:', error.message);
  }

  // Test 3: File Operations
  try {
    console.log('\n3. Testing File Operations...');
    const response = await axios.get(`${BACKEND_URL}/api/workspace/files`);
    console.log('✅ File operations are working');
    console.log(`   Workspace files: ${response.data.files.length}`);
  } catch (error) {
    console.log('❌ File operations failed:', error.message);
  }

  // Test 4: Tool Execution
  try {
    console.log('\n4. Testing Tool Execution...');
    const response = await axios.post(`${BACKEND_URL}/api/tools/execute`, {
      toolName: 'file_list',
      params: {}
    });
    console.log('✅ Tool execution is working');
    console.log(`   Result: ${response.data.success ? 'Success' : 'Failed'}`);
  } catch (error) {
    console.log('❌ Tool execution failed:', error.message);
  }

  // Test 5: WebSocket Connection
  try {
    console.log('\n5. Testing WebSocket Connection...');
    const ws = new WebSocket(WS_URL);
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket connection established');
        ws.close();
        resolve();
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  } catch (error) {
    console.log('❌ WebSocket connection failed:', error.message);
  }

  // Test 6: Frontend (if available)
  try {
    console.log('\n6. Testing Frontend...');
    const response = await axios.get(FRONTEND_URL);
    console.log('✅ Frontend is responding');
  } catch (error) {
    console.log('❌ Frontend failed:', error.message);
  }

  console.log('\n🎉 System test completed!');
  console.log('\n📱 Access your application at:');
  console.log(`   Frontend: ${FRONTEND_URL}`);
  console.log(`   Backend:  ${BACKEND_URL}`);
  console.log(`   WebSocket: ${WS_URL}`);
}

testSystem().catch(console.error);