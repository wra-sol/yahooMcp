# n8n MCP Client Code Node Guide

This guide shows you how to use the Yahoo Fantasy MCP server directly from n8n using a Code node, bypassing the problematic MCP Client node.

## 📋 Setup Instructions

### Step 1: Add the Code Node to Your Workflow

1. Open your n8n workflow
2. Add a **Code** node
3. Copy the contents of `n8n-mcp-client-code-node.js` into the code editor
4. Save the node

### Step 2: Configure Input Data

The Code node expects input data in this format:

```json
{
  "operation": "list_tools",  // or "call_tool"
  "tool_name": "get_user_leagues",  // only for call_tool
  "arguments": {  // only for call_tool
    "gameKey": "nhl"
  }
}
```

## 🔧 Example Workflows

### Example 1: List All Available Tools

**Workflow:**
```
Manual Trigger → Set Node → MCP Code Node
```

**Set Node Configuration:**
```json
{
  "operation": "list_tools"
}
```

**Result:**
Returns all 51 Yahoo Fantasy MCP tools with their descriptions and parameters.

---

### Example 2: Get Your NHL Leagues

**Workflow:**
```
Manual Trigger → Set Node → MCP Code Node
```

**Set Node Configuration:**
```json
{
  "operation": "call_tool",
  "tool_name": "get_user_leagues",
  "arguments": {
    "gameKey": "nhl"
  }
}
```

**Result:**
Returns all your NHL fantasy leagues with league keys and team info.

---

### Example 3: Get Team Roster

**Workflow:**
```
Manual Trigger → Set Node → MCP Code Node
```

**Set Node Configuration:**
```json
{
  "operation": "call_tool",
  "tool_name": "get_team_roster",
  "arguments": {
    "teamKey": "465.l.27830.t.10"
  }
}
```

**Result:**
Returns your team's complete roster with all players.

---

### Example 4: Get Free Agents

**Workflow:**
```
Manual Trigger → Set Node → MCP Code Node
```

**Set Node Configuration:**
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

**Result:**
Returns top 25 available centers in your league.

---

### Example 5: Dynamic Tool Calls (Using JavaScript in Set Node)

**Workflow:**
```
Manual Trigger → Code Node (League Parser) → MCP Code Node → Process Results
```

**Code Node (League Parser):**
```javascript
const leagueUrl = "https://hockey.fantasysports.yahoo.com/hockey/27830/10";
const parts = leagueUrl.split("/");
const leagueId = parts[4];
const teamId = parts[5];

return [{
  json: {
    operation: "call_tool",
    tool_name: "get_team_roster",
    arguments: {
      teamKey: `465.l.${leagueId}.t.${teamId}`
    }
  }
}];
```

---

## 🎯 Integration with Your Fantasy Sports Agents

### Replace MCP Client in Your Current Workflow

**Before (Not Working):**
```
Trigger → Fetcher Agent (with MCP Client tool) → Recommendations Agent → Manager Agent
```

**After (Working):**
```
Trigger → Parse Leagues → MCP Code Node → Fetcher Agent → Recommendations Agent → Manager Agent
```

### Updated Fetcher Agent Configuration

Instead of using MCP Client as a tool, the Fetcher can receive data from the MCP Code Node:

**Workflow Structure:**
```
1. Manual Trigger
2. Set Node (define what data to fetch)
3. MCP Code Node (fetch the data)
4. Code Node (format for Recommendations Agent)
5. Recommendations Agent (analyze data)
6. Manager Agent (execute actions via MCP Code Nodes)
```

---

## 🔄 Advanced: Parallel Tool Calls

Fetch multiple pieces of data simultaneously:

**Workflow:**
```
Manual Trigger → Split in Batches → MCP Code Node → Merge
```

**Split in Batches Input:**
```json
[
  {
    "operation": "call_tool",
    "tool_name": "get_team_roster",
    "arguments": { "teamKey": "465.l.27830.t.10" }
  },
  {
    "operation": "call_tool",
    "tool_name": "get_league_settings",
    "arguments": { "leagueKey": "465.l.27830" }
  },
  {
    "operation": "call_tool",
    "tool_name": "get_league_scoreboard",
    "arguments": { "leagueKey": "465.l.27830" }
  }
]
```

Each will be processed by the MCP Code Node in parallel.

---

## 📊 Output Format

### Successful Response

```json
{
  "success": true,
  "operation": "call_tool",
  "tool_name": "get_user_leagues",
  "result": {
    // Tool-specific result data
  },
  "raw_response": {
    "jsonrpc": "2.0",
    "id": 1696789200000,
    "result": { /* ... */ }
  }
}
```

### Error Response

```json
{
  "success": false,
  "operation": "call_tool",
  "tool_name": "get_user_leagues",
  "error": "MCP Error (-32001): Not authenticated with Yahoo",
  "error_details": "..."
}
```

---

## 🛠️ Complete Example: Fantasy Morning Report

**Workflow:**
```
Schedule Trigger (6am daily)
  ↓
Parse League URLs
  ↓
[MCP Code] Get Team Roster
  ↓
[MCP Code] Get League Standings
  ↓
[MCP Code] Get Current Matchup
  ↓
[MCP Code] Get Free Agents
  ↓
Code Node (Format Report)
  ↓
Gmail (Send Report)
```

**Parse League URLs Node:**
```javascript
const leagues = ["https://hockey.fantasysports.yahoo.com/hockey/27830/10"];

return leagues.map(url => {
  const parts = url.split("/");
  const sport = parts[3];
  const leagueId = parts[4];
  const teamId = parts[5];
  
  return {
    json: {
      sport,
      leagueKey: `465.l.${leagueId}`,
      teamKey: `465.l.${leagueId}.t.${teamId}`
    }
  };
});
```

**Get Team Roster (MCP Code Node Input):**
```javascript
// Use the Code node with this input
return [{
  json: {
    operation: "call_tool",
    tool_name: "get_team_roster",
    arguments: {
      teamKey: $json.teamKey
    }
  }
}];
```

---

## 🚀 Benefits of This Approach

1. ✅ **No dependency issues** - Direct HTTP calls bypass n8n's MCP Client bugs
2. ✅ **Full control** - You can modify the code to fit your needs
3. ✅ **Better error handling** - See exactly what's failing
4. ✅ **Works with any n8n version** - Just needs the Code node
5. ✅ **Easy to debug** - Standard JSON-RPC over HTTP
6. ✅ **Reusable** - Save as a template and use across workflows

---

## 🔐 Authentication

The Yahoo authentication is handled server-side on Railway. As long as you've authenticated via the web interface (`https://yahoo-mcp-production.up.railway.app/`), all tool calls will work automatically.

To check authentication status:
```json
{
  "operation": "list_tools"
}
```

If `list_tools` works but actual tool calls fail with "Not authenticated", visit the server URL and complete OAuth.

---

## 📝 Available Tools

Run this to see all 51 available tools:

```json
{
  "operation": "list_tools"
}
```

Key tools for your workflow:
- `get_user_leagues` - Get your leagues
- `get_team_roster` - Get team roster
- `get_league_settings` - Get league configuration
- `get_league_scoreboard` - Get current matchups
- `get_free_agents` - Get available players
- `get_player_stats` - Get player statistics
- `add_drop_players` - Execute transactions
- `edit_team_roster` - Modify lineup

---

## 🆘 Troubleshooting

### "Not authenticated" Error

**Solution:** Visit `https://yahoo-mcp-production.up.railway.app/` and complete OAuth flow.

### "Connection refused" Error

**Solution:** Check that Railway deployment is running. Visit the health endpoint:
```
https://yahoo-mcp-production.up.railway.app/health
```

### "Invalid tool name" Error

**Solution:** Run `list_tools` operation to see all available tool names (case-sensitive).

### "Invalid arguments" Error

**Solution:** Check the tool's `inputSchema` from `list_tools` to see required parameters.

---

## 📚 Next Steps

1. Copy the code from `n8n-mcp-client-code-node.js` into an n8n Code node
2. Create a test workflow with the "List Tools" example
3. Once working, integrate into your Fantasy Sports agent workflow
4. Replace all MCP Client nodes with MCP Code nodes

**Your agents can now reliably access all Yahoo Fantasy data!** 🎉

