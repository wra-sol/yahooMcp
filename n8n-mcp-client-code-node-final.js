/**
 * n8n Code Node: Yahoo Fantasy MCP Client (Final - Working Version)
 * 
 * USAGE IN SET NODE:
 * {
 *   "operation": "list_tools",
 *   "tool_name": "get_user_leagues",
 *   "arguments": { "gameKey": "nhl" }
 * }
 */

const MCP_URL = 'https://yahoo-mcp-production.up.railway.app/mcp/message';

// Get input
const operation = $input.first().json.operation || 'list_tools';
const toolName = $input.first().json.tool_name;
const args = $input.first().json.arguments || {};

// Build JSON-RPC request
let rpcRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: operation === 'list_tools' ? 'tools/list' : 'tools/call',
  params: operation === 'list_tools' ? {} : {
    name: toolName,
    arguments: args
  }
};

// Make HTTP request using n8n's $http helper
const response = await $http.request({
  method: 'POST',
  url: MCP_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  body: rpcRequest,
  json: true
});

// Check for MCP errors
if (response.error) {
  throw new Error(`MCP Error: ${response.error.message} (code: ${response.error.code})`);
}

// Return the result
return { json: response.result };

