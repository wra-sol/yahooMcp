# n8n MCP Client - Quick Start

## 🎯 Problem Solved

The n8n MCP Client node isn't connecting to your Yahoo Fantasy MCP server. This solution bypasses that node entirely using direct HTTP calls in a Code node.

## ⚡ Quick Setup (3 Steps)

### Step 1: Import the Example Workflow

1. Open n8n
2. Click **Workflows** → **Import from File**
3. Import `n8n-example-workflow.json`
4. Activate the workflow

### Step 2: Test the Connection

1. Click **Execute Workflow** on the Manual Trigger
2. You should see your NHL leagues returned
3. ✅ Success! The MCP connection works!

### Step 3: Customize for Your Needs

Modify the **Set Input** node to call different tools:

**List all available tools:**
```json
{
  "operation": "list_tools"
}
```

**Get team roster:**
```json
{
  "operation": "call_tool",
  "tool_name": "get_team_roster",
  "arguments": {
    "teamKey": "465.l.27830.t.10"
  }
}
```

**Get free agents:**
```json
{
  "operation": "call_tool",
  "tool_name": "get_free_agents",
  "arguments": {
    "leagueKey": "465.l.27830",
    "position": "C",
    "count": 25
  }
}
```

---

## 🔄 Integrate with Your Existing Workflow

### Replace Your MCP Client Nodes

**Before:**
```
Your Agent Node → MCP Client (not working)
```

**After:**
```
Your Agent Node → Set Input → MCP Code Node
```

### Example: Update Your Fetcher Agent

1. **Remove** the MCP Client tool connection from Fetcher Agent
2. **Add** a Set node before Fetcher to prepare MCP requests
3. **Add** the MCP Code node to execute requests
4. **Connect** results to Fetcher Agent as input data

---

## 📋 The Code Node (Copy/Paste Ready)

If you want to create the node manually instead of importing:

1. Add a **Code** node to your workflow
2. Paste this code:

```javascript
const MCP_SERVER_URL = 'https://yahoo-mcp-production.up.railway.app/mcp/message';

const items = $input.all();
const results = [];

for (const item of items) {
  const operation = item.json.operation || 'list_tools';
  const toolName = item.json.tool_name;
  const toolArguments = item.json.arguments || {};
  
  try {
    let requestBody;
    
    if (operation === 'list_tools') {
      requestBody = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list',
        params: {}
      };
    } else if (operation === 'call_tool') {
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
    
    if (data.error) {
      throw new Error(`MCP Error (${data.error.code}): ${data.error.message}`);
    }
    
    results.push({
      json: {
        success: true,
        operation: operation,
        tool_name: toolName,
        result: data.result,
        raw_response: data
      }
    });
    
  } catch (error) {
    results.push({
      json: {
        success: false,
        operation: operation,
        tool_name: toolName,
        error: error.message,
        error_details: error.stack
      }
    });
  }
}

return results;
```

3. Save the node
4. Done!

---

## 🎯 Common Tool Calls

### Get Your Leagues
```json
{
  "operation": "call_tool",
  "tool_name": "get_user_leagues",
  "arguments": { "gameKey": "nhl" }
}
```

### Get Team Roster
```json
{
  "operation": "call_tool",
  "tool_name": "get_team_roster",
  "arguments": { "teamKey": "465.l.27830.t.10" }
}
```

### Get League Settings
```json
{
  "operation": "call_tool",
  "tool_name": "get_league_settings",
  "arguments": { "leagueKey": "465.l.27830" }
}
```

### Get Free Agents
```json
{
  "operation": "call_tool",
  "tool_name": "get_free_agents",
  "arguments": {
    "leagueKey": "465.l.27830",
    "position": "C",
    "count": 25
  }
}
```

### Get Player Stats
```json
{
  "operation": "call_tool",
  "tool_name": "get_player_stats",
  "arguments": {
    "playerKey": "465.p.31175",
    "statType": "lastweek"
  }
}
```

---

## ✅ Benefits

- ✅ **Works immediately** - No debugging n8n's MCP Client
- ✅ **Reliable** - Direct HTTP calls are stable
- ✅ **Flexible** - Easy to customize and extend
- ✅ **Debuggable** - See exactly what's happening
- ✅ **Reusable** - Copy the Code node to any workflow

---

## 📚 Full Documentation

- **Comprehensive Guide**: See `N8N_CODE_NODE_GUIDE.md`
- **API Reference**: See `API_DOCUMENTATION.md`
- **MCP Server Docs**: See `README.md`

---

## 🆘 Need Help?

### Authentication Error
Visit `https://yahoo-mcp-production.up.railway.app/` and complete OAuth.

### Invalid Tool Name
Run the `list_tools` operation to see all available tools.

### Connection Error
Check Railway deployment at `https://yahoo-mcp-production.up.railway.app/health`

---

**You're all set! Import the workflow and start automating your fantasy sports! 🚀**

