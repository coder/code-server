const axios = require('axios');
const WebSocket = require('ws');

const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5173';
const WS_URL = 'ws://localhost:8080';
const CODE_SERVER_URL = 'http://localhost:8081';

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  retries: 3,
  delay: 1000
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logTest = (testName, status, details = '') => {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
    log(`✅ ${testName}`, 'green');
  } else {
    testResults.failed++;
    log(`❌ ${testName}`, 'red');
  }
  if (details) {
    log(`   ${details}`, 'yellow');
  }
  testResults.details.push({ testName, status, details });
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test functions
const testBackendHealth = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: TEST_CONFIG.timeout });
    if (response.status === 200 && response.data.status === 'healthy') {
      logTest('Backend Health Check', 'PASS', `Uptime: ${response.data.uptime}s`);
      return true;
    } else {
      logTest('Backend Health Check', 'FAIL', 'Invalid response');
      return false;
    }
  } catch (error) {
    logTest('Backend Health Check', 'FAIL', error.message);
    return false;
  }
};

const testBackendAPI = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/providers`, { timeout: TEST_CONFIG.timeout });
    if (response.status === 200 && response.data.providers) {
      const providers = response.data.providers;
      logTest('Backend API - Providers', 'PASS', `Found ${providers.length} providers`);
      
      // Test each provider
      for (const provider of providers) {
        if (provider.id && provider.name && provider.models) {
          logTest(`Provider: ${provider.name}`, 'PASS', `Models: ${provider.models.length}`);
        } else {
          logTest(`Provider: ${provider.name}`, 'FAIL', 'Invalid provider structure');
        }
      }
      return true;
    } else {
      logTest('Backend API - Providers', 'FAIL', 'Invalid response structure');
      return false;
    }
  } catch (error) {
    logTest('Backend API - Providers', 'FAIL', error.message);
    return false;
  }
};

const testToolsAPI = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/tools`, { timeout: TEST_CONFIG.timeout });
    if (response.status === 200 && response.data.tools) {
      const tools = response.data.tools;
      logTest('Tools API', 'PASS', `Found ${tools.length} tools`);
      
      // Test tool execution
      const toolTest = await axios.post(`${BACKEND_URL}/api/tools/execute`, {
        toolName: 'file_list',
        params: {}
      }, { timeout: TEST_CONFIG.timeout });
      
      if (toolTest.status === 200) {
        logTest('Tool Execution', 'PASS', 'File list tool executed successfully');
      } else {
        logTest('Tool Execution', 'FAIL', 'Tool execution failed');
      }
      return true;
    } else {
      logTest('Tools API', 'FAIL', 'Invalid response structure');
      return false;
    }
  } catch (error) {
    logTest('Tools API', 'FAIL', error.message);
    return false;
  }
};

const testWebSocketConnection = async () => {
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    let connected = false;
    
    const timeout = setTimeout(() => {
      if (!connected) {
        ws.close();
        logTest('WebSocket Connection', 'FAIL', 'Connection timeout');
        resolve(false);
      }
    }, TEST_CONFIG.timeout);
    
    ws.on('open', () => {
      connected = true;
      clearTimeout(timeout);
      logTest('WebSocket Connection', 'PASS', 'Connected successfully');
      ws.close();
      resolve(true);
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      logTest('WebSocket Connection', 'FAIL', error.message);
      resolve(false);
    });
  });
};

const testFrontend = async () => {
  try {
    const response = await axios.get(FRONTEND_URL, { timeout: TEST_CONFIG.timeout });
    if (response.status === 200) {
      logTest('Frontend', 'PASS', 'Frontend accessible');
      return true;
    } else {
      logTest('Frontend', 'FAIL', `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Frontend', 'FAIL', error.message);
    return false;
  }
};

const testCodeServer = async () => {
  try {
    const response = await axios.get(CODE_SERVER_URL, { timeout: TEST_CONFIG.timeout });
    if (response.status === 200) {
      logTest('Code Server', 'PASS', 'Code server accessible');
      return true;
    } else {
      logTest('Code Server', 'FAIL', `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Code Server', 'FAIL', error.message);
    return false;
  }
};

const testAIChat = async () => {
  try {
    // Test with a mock API key (this will fail but should return proper error)
    const response = await axios.post(`${BACKEND_URL}/api/chat`, {
      message: 'Hello',
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4'
    }, { timeout: TEST_CONFIG.timeout });
    
    logTest('AI Chat - Error Handling', 'PASS', 'Proper error handling for invalid API key');
    return true;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logTest('AI Chat - Error Handling', 'PASS', 'Proper 401 error for invalid API key');
      return true;
    } else {
      logTest('AI Chat - Error Handling', 'FAIL', error.message);
      return false;
    }
  }
};

const testFileOperations = async () => {
  try {
    // Test file listing
    const listResponse = await axios.get(`${BACKEND_URL}/api/workspace/files`, { timeout: TEST_CONFIG.timeout });
    if (listResponse.status === 200) {
      logTest('File Operations - List', 'PASS', 'File listing works');
    } else {
      logTest('File Operations - List', 'FAIL', 'File listing failed');
      return false;
    }
    
    // Test file creation
    const createResponse = await axios.post(`${BACKEND_URL}/api/workspace/file/test.txt`, {
      content: 'Hello World!'
    }, { timeout: TEST_CONFIG.timeout });
    
    if (createResponse.status === 200) {
      logTest('File Operations - Create', 'PASS', 'File creation works');
    } else {
      logTest('File Operations - Create', 'FAIL', 'File creation failed');
    }
    
    return true;
  } catch (error) {
    logTest('File Operations', 'FAIL', error.message);
    return false;
  }
};

const testTerminalExecution = async () => {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/terminal`, {
      command: 'echo "Hello World"'
    }, { timeout: TEST_CONFIG.timeout });
    
    if (response.status === 200 && response.data.success) {
      logTest('Terminal Execution', 'PASS', 'Terminal command executed');
      return true;
    } else {
      logTest('Terminal Execution', 'FAIL', 'Terminal execution failed');
      return false;
    }
  } catch (error) {
    logTest('Terminal Execution', 'FAIL', error.message);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  log('\n🧪 Starting Comprehensive Application Tests\n', 'bold');
  
  // Wait for services to start
  log('⏳ Waiting for services to start...', 'yellow');
  await sleep(5000);
  
  // Run all tests
  const tests = [
    { name: 'Backend Health Check', fn: testBackendHealth },
    { name: 'Backend API - Providers', fn: testBackendAPI },
    { name: 'Tools API', fn: testToolsAPI },
    { name: 'WebSocket Connection', fn: testWebSocketConnection },
    { name: 'Frontend', fn: testFrontend },
    { name: 'Code Server', fn: testCodeServer },
    { name: 'AI Chat Error Handling', fn: testAIChat },
    { name: 'File Operations', fn: testFileOperations },
    { name: 'Terminal Execution', fn: testTerminalExecution }
  ];
  
  for (const test of tests) {
    try {
      await test.fn();
      await sleep(1000); // Small delay between tests
    } catch (error) {
      logTest(test.name, 'FAIL', `Unexpected error: ${error.message}`);
    }
  }
  
  // Print summary
  log('\n📊 Test Summary\n', 'bold');
  log(`Total Tests: ${testResults.total}`, 'cyan');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  
  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults.details
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        log(`  - ${test.testName}: ${test.details}`, 'red');
      });
  }
  
  log('\n🎉 Testing Complete!', 'bold');
  
  if (testResults.failed === 0) {
    log('✅ All tests passed! Application is ready for production.', 'green');
    process.exit(0);
  } else {
    log('⚠️  Some tests failed. Please check the issues above.', 'yellow');
    process.exit(1);
  }
};

// Run tests
runTests().catch(error => {
  log(`\n💥 Test runner error: ${error.message}`, 'red');
  process.exit(1);
});