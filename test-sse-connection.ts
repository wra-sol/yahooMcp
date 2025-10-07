#!/usr/bin/env bun

/**
 * Test script to simulate n8n's MCP SSE connection
 * 
 * Usage: bun run test-sse-connection.ts
 */

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

async function testSSEConnection() {
  console.log('🧪 Testing MCP SSE Connection');
  console.log(`📡 Server: ${SERVER_URL}`);
  console.log('');

  // Step 1: Test health endpoint
  console.log('1️⃣  Testing health endpoint...');
  try {
    const healthResponse = await fetch(`${SERVER_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', JSON.stringify(healthData, null, 2));
    
    if (!healthData.mcpEnabled) {
      console.log('⚠️  MCP is not enabled. Please authenticate first.');
    }
  } catch (error: any) {
    console.log('❌ Health check failed:', error.message);
    return;
  }
  console.log('');

  // Step 2: Connect to SSE endpoint
  console.log('2️⃣  Connecting to SSE endpoint...');
  let sessionId: string | null = null;
  
  try {
    const sseResponse = await fetch(`${SERVER_URL}/mcp`, {
      headers: {
        'Accept': 'text/event-stream',
      },
    });

    if (!sseResponse.ok) {
      console.log(`❌ SSE connection failed: ${sseResponse.status} ${sseResponse.statusText}`);
      return;
    }

    console.log(`✅ SSE connected: ${sseResponse.status} ${sseResponse.headers.get('content-type')}`);
    
    // Read SSE stream
    const reader = sseResponse.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      console.log('❌ No reader available');
      return;
    }

    // Read first few messages
    let messagesReceived = 0;
    const maxMessages = 3;
    
    console.log('📥 Receiving SSE messages:');
    
    while (messagesReceived < maxMessages) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('Stream ended');
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          try {
            const parsed = JSON.parse(data);
            console.log(`   📨 ${JSON.stringify(parsed, null, 2)}`);
            
            // Extract session ID if present
            if (parsed.params?.sessionId) {
              sessionId = parsed.params.sessionId;
              console.log(`   🔑 Session ID: ${sessionId}`);
            }
            
            messagesReceived++;
          } catch (e) {
            console.log(`   📄 ${data}`);
          }
        } else if (line.startsWith(': ')) {
          console.log(`   💓 Ping received`);
        }
      }
    }
    
    // Cancel the stream
    reader.cancel();
    console.log('✅ SSE stream test completed');
  } catch (error: any) {
    console.log('❌ SSE connection error:', error.message);
    return;
  }
  console.log('');

  // Step 3: Test message endpoint
  if (sessionId) {
    console.log('3️⃣  Testing message endpoint with session ID...');
    
    try {
      const initResponse = await fetch(`${SERVER_URL}/mcp/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {},
        }),
      });

      const initData = await initResponse.json();
      console.log('✅ Initialize response:', JSON.stringify(initData, null, 2));
    } catch (error: any) {
      console.log('❌ Initialize failed:', error.message);
    }
    console.log('');

    console.log('4️⃣  Testing tools/list endpoint...');
    
    try {
      const listResponse = await fetch(`${SERVER_URL}/mcp/message`, {
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

      const listData = await listResponse.json();
      console.log('✅ Tools list response:');
      console.log(`   Found ${listData.result?.tools?.length || 0} tools`);
      if (listData.result?.tools?.length > 0) {
        console.log(`   Sample: ${listData.result.tools[0].name}`);
      }
    } catch (error: any) {
      console.log('❌ Tools list failed:', error.message);
    }
  } else {
    console.log('3️⃣  ⚠️  No session ID received - testing without session...');
    
    try {
      const listResponse = await fetch(`${SERVER_URL}/mcp/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {},
        }),
      });

      const listData = await listResponse.json();
      console.log('✅ Tools list response (no session):', JSON.stringify(listData, null, 2));
    } catch (error: any) {
      console.log('❌ Tools list failed:', error.message);
    }
  }
  
  console.log('');
  console.log('✅ Test completed!');
}

// Run the test
testSSEConnection().catch(console.error);
