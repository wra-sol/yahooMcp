/**
 * n8n Code Node: Yahoo Fantasy MCP Client (v2 - Fixed)
 * 
 * USAGE:
 * Input format:
 * {
 *   "operation": "list_tools" or "call_tool",
 *   "tool_name": "get_user_leagues",  // for call_tool only
 *   "arguments": { "gameKey": "nhl" }  // for call_tool only
 * }
 */

const MCP_URL = 'https://yahoo-mcp-production.up.railway.app/mcp/message';

// Process each input item
for (const item of $input.all()) {
  const operation = item.json.operation || 'list_tools';
  const toolName = item.json.tool_name;
  const args = item.json.arguments || {};
  
  // Build JSON-RPC request
  let rpcRequest;
  
  if (operation === 'list_tools') {
    rpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };
  } else if (operation === 'call_tool') {
    if (!toolName) {
      throw new Error('tool_name is required for call_tool operation');
    }
    rpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };
  } else {
    throw new Error('operation must be "list_tools" or "call_tool"');
  }
  
  // Make request
  const response = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rpcRequest)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Check for errors
  if (data.error) {
    throw new Error(`MCP Error: ${data.error.message} (code: ${data.error.code})`);
  }
  
  // Return the result
  return {
    json: {
      success: true,
      operation,
      tool_name: toolName,
      data: data.result
    }
  };
}

