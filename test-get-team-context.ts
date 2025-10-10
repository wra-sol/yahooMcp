#!/usr/bin/env bun

/**
 * Test script for get_team_context tool via SSE transport
 */

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

async function testGetTeamContext() {
  console.log('🧪 Testing get_team_context tool...\n');
  
  // Step 1: Establish SSE connection
  console.log('1️⃣  Establishing SSE connection...');
  const sseResponse = await fetch(`${SERVER_URL}/mcp`);
  
  if (!sseResponse.ok) {
    throw new Error(`SSE connection failed: ${sseResponse.status} ${sseResponse.statusText}`);
  }
  
  // Extract session ID from the SSE stream
  const reader = sseResponse.body?.getReader();
  const decoder = new TextDecoder();
  let sessionId = '';
  
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      console.log('📡 SSE chunk:', chunk.substring(0, 200));
      
      // Look for endpoint event with session ID
      const endpointMatch = chunk.match(/event: endpoint\ndata: (.+)/);
      if (endpointMatch) {
        const endpointUrl = endpointMatch[1].trim();
        const sessionMatch = endpointUrl.match(/sessionId=([a-f0-9-]+)/);
        if (sessionMatch) {
          sessionId = sessionMatch[1];
          console.log('✅ Session ID:', sessionId);
          break;
        }
      }
      
      // Also check for session ID in other formats
      if (chunk.includes('sessionId')) {
        const match = chunk.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);
        if (match) {
          sessionId = match[1];
          console.log('✅ Session ID found:', sessionId);
          break;
        }
      }
    }
  }
  
  if (!sessionId) {
    throw new Error('Could not extract session ID from SSE stream');
  }
  
  // Step 2: Send tool call
  console.log('\n2️⃣  Calling get_team_context tool...');
  const toolCallResponse = await fetch(`${SERVER_URL}/mcp/messages?sessionId=${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'get_team_context',
        arguments: {
          leagueKey: '465.l.27830',
          teamKey: '465.l.27830.t.10',
          options: {
            week: '',
          },
        },
      },
    }),
  });
  
  console.log('📤 Tool call status:', toolCallResponse.status, toolCallResponse.statusText);
  
  if (!toolCallResponse.ok) {
    const errorText = await toolCallResponse.text();
    console.error('❌ Tool call failed:', errorText);
    throw new Error(`Tool call failed: ${toolCallResponse.status}`);
  }
  
  // Step 3: Wait for response via SSE (already connected)
  console.log('\n3️⃣  Waiting for response via SSE...');
  console.log('✅ Request accepted (202), response will be sent via SSE stream');
  console.log('\n📊 Check server logs for:');
  console.log('   - [executeTool] Called with name=get_team_context');
  console.log('   - [buildTeamContext] Called with...');
  console.log('   - [buildTeamContext] Completed successfully');
  console.log('   - [MCP] Tool completed, result size: XXX bytes');
  
  console.log('\n✅ Test completed! Check the server logs above for full execution trace.');
}

// Run the test
testGetTeamContext().catch((error) => {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
});

