/**
 * Test script for MCP SSE connection
 * This simulates how n8n connects to the MCP server
 */

export {}; // Make this a module to avoid global scope conflicts

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

interface SSEMessage {
  event?: string;
  data?: string;
}

/**
 * Parse SSE message from text
 */
function parseSSEMessage(text: string): SSEMessage | null {
  const lines = text.split('\n');
  const message: SSEMessage = {};
  
  for (const line of lines) {
    if (line.startsWith('event:')) {
      message.event = line.substring(6).trim();
    } else if (line.startsWith('data:')) {
      message.data = line.substring(5).trim();
    } else if (line.startsWith(':')) {
      // Comment/keepalive, ignore
      continue;
    }
  }
  
  return message.data || message.event ? message : null;
}

/**
 * Test SSE connection and send a message
 */
async function testMcpConnection() {
  console.log(`\n🔍 Testing MCP SSE Connection to ${SERVER_URL}\n`);
  
  // Step 1: Establish SSE connection
  console.log('Step 1: Establishing SSE connection...');
  const sseUrl = `${SERVER_URL}/mcp`;
  
  let sessionId: string | null = null;
  let messageEndpoint: string | null = null;
  
  try {
    const response = await fetch(sseUrl, {
      headers: {
        'Accept': 'text/event-stream',
      },
    });
    
    if (!response.ok) {
      console.error(`❌ SSE connection failed: ${response.status} ${response.statusText}`);
      const body = await response.text();
      console.error(`Response body: ${body}`);
      return;
    }
    
    // Get session ID from headers
    sessionId = response.headers.get('X-Session-Id');
    console.log(`✅ SSE connection established`);
    console.log(`   Session ID: ${sessionId}`);
    
    if (!sessionId) {
      console.error('❌ No session ID received in headers');
      return;
    }
    
    // Read SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      console.error('❌ Could not get stream reader');
      return;
    }
    
    const decoder = new TextDecoder();
    let buffer = '';
    let receivedEndpoint = false;
    
    // Set up message handler
    const readStream = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim()) {
            const message = parseSSEMessage(line);
            if (message) {
              if (message.event === 'endpoint') {
                messageEndpoint = message.data || null;
                receivedEndpoint = true;
                console.log(`✅ Received endpoint: ${messageEndpoint}`);
              } else if (message.event === 'message') {
                console.log(`📨 Received message:`, message.data);
                try {
                  const parsed = JSON.parse(message.data || '{}');
                  console.log(JSON.stringify(parsed, null, 2));
                } catch (e) {
                  console.log(message.data);
                }
              } else if (line.startsWith(':')) {
                console.log(`💓 Keepalive ping`);
              } else {
                console.log(`📩 Other event:`, message);
              }
            }
          }
        }
      }
    };
    
    // Start reading stream in background
    readStream().catch((error) => {
      console.error('Stream reading error:', error);
    });
    
    // Wait for endpoint message
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (receivedEndpoint) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(null);
      }, 5000);
    });
    
    if (!receivedEndpoint) {
      console.error('❌ Did not receive endpoint message');
      reader.cancel();
      return;
    }
    
    // Step 2: Send initialize message
    console.log('\nStep 2: Sending initialize message...');
    const initResponse = await fetch(`${SERVER_URL}${messageEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0',
          },
        },
      }),
    });
    
    if (!initResponse.ok) {
      console.error(`❌ Initialize request failed: ${initResponse.status}`);
      const body = await initResponse.text();
      console.error(`Response: ${body}`);
      reader.cancel();
      return;
    }
    
    console.log(`✅ Initialize request sent (status: ${initResponse.status})`);
    
    // Wait for response through SSE
    console.log('⏳ Waiting for initialize response through SSE...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Step 3: List tools
    console.log('\nStep 3: Sending tools/list request...');
    const listToolsResponse = await fetch(`${SERVER_URL}${messageEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      }),
    });
    
    if (!listToolsResponse.ok) {
      console.error(`❌ List tools request failed: ${listToolsResponse.status}`);
      const body = await listToolsResponse.text();
      console.error(`Response: ${body}`);
    } else {
      console.log(`✅ List tools request sent (status: ${listToolsResponse.status})`);
    }
    
    // Wait for response
    console.log('⏳ Waiting for tools/list response through SSE...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Clean up
    console.log('\n✅ Test complete, closing connection...');
    reader.cancel();
    
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
  }
}

/**
 * Test direct HTTP (non-SSE) mode
 */
async function testDirectHttp() {
  console.log(`\n🔍 Testing Direct HTTP (non-SSE) Mode\n`);
  
  // Test initialize
  console.log('Step 1: Sending initialize message (direct HTTP)...');
  try {
    const response = await fetch(`${SERVER_URL}/mcp/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0',
          },
        },
      }),
    });
    
    if (!response.ok) {
      console.error(`❌ Request failed: ${response.status}`);
      const body = await response.text();
      console.error(`Response: ${body}`);
      return;
    }
    
    const result = await response.json();
    console.log(`✅ Response received:`);
    console.log(JSON.stringify(result, null, 2));
    
    // Test list tools
    console.log('\nStep 2: Sending tools/list message (direct HTTP)...');
    const listResponse = await fetch(`${SERVER_URL}/mcp/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      }),
    });
    
    if (!listResponse.ok) {
      console.error(`❌ Request failed: ${listResponse.status}`);
      const body = await listResponse.text();
      console.error(`Response: ${body}`);
      return;
    }
    
    const listResult = await listResponse.json();
    console.log(`✅ Response received:`);
    console.log(JSON.stringify(listResult, null, 2));
    
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

/**
 * Main entry point
 */
async function main() {
  const mode = process.argv[2] || 'sse';
  
  if (mode === 'sse') {
    await testMcpConnection();
  } else if (mode === 'http') {
    await testDirectHttp();
  } else if (mode === 'both') {
    await testDirectHttp();
    console.log('\n' + '='.repeat(60) + '\n');
    await testMcpConnection();
  } else {
    console.error('Usage: bun run test-sse-mcp.ts [sse|http|both]');
    process.exit(1);
  }
}

main().catch(console.error);

