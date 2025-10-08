/**
 * n8n Code Node: MCP Client for Yahoo Fantasy
 * 
 * This node provides a simple interface to call Yahoo Fantasy MCP tools
 * without needing the MCP Client node.
 * 
 * USAGE:
 * 1. Add this code to a Code node in n8n
 * 2. Configure the operation type in the input
 * 3. Connect to your workflow
 * 
 * INPUT FORMAT:
 * {
 *   "operation": "list_tools" | "call_tool",
 *   "tool_name": "get_user_leagues",  // Only for call_tool
 *   "arguments": {                     // Only for call_tool
 *     "gameKey": "nhl"
 *   }
 * }
 * 
 * OUTPUT:
 * Returns the MCP server response directly
 */

const MCP_SERVER_URL = 'https://yahoo-mcp-production.up.railway.app/mcp/message';

// Get input from previous node
const items = $input.all();
const results = [];

for (const item of items) {
  const operation = item.json.operation || 'list_tools';
  const toolName = item.json.tool_name;
  const toolArguments = item.json.arguments || {};
  
  try {
    let requestBody;
    
    if (operation === 'list_tools') {
      // List all available tools
      requestBody = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list',
        params: {}
      };
    } else if (operation === 'call_tool') {
      // Call a specific tool
      if (!toolName) {
        throw new Error('tool_name is required for call_tool operation');
      }
      
      requestBody = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: toolArguments
        }
      };
    } else {
      throw new Error(`Unknown operation: ${operation}`);
    }
    
    // Make the HTTP request to MCP server
    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check for JSON-RPC errors
    if (data.error) {
      throw new Error(`MCP Error (${data.error.code}): ${data.error.message}`);
    }
    
    // Return the result
    results.push({
      json: {
        success: true,
        operation: operation,
        tool_name: toolName,
        ...data.result  // Spread the result directly into json
      },
      pairedItem: { item: items.indexOf(item) }
    });
    
  } catch (error) {
    results.push({
      json: {
        success: false,
        operation: operation,
        tool_name: toolName,
        error: error.message,
        error_details: error.stack
      },
      pairedItem: { item: items.indexOf(item) }
    });
  }
}

return results;

