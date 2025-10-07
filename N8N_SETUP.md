# n8n MCP Client Setup Guide

This guide explains how to use the Yahoo Fantasy MCP server with n8n's MCP Client node.

## Overview

The Yahoo Fantasy MCP server now supports **HTTP/SSE transport** in addition to stdio, making it compatible with n8n workflows and other remote MCP clients.

## Prerequisites

1. **Yahoo Fantasy MCP Server** deployed and running (e.g., on Railway)
2. **OAuth Authentication** completed via the web interface
3. **n8n instance** with MCP Client node installed

## Quick Start

### 1. Authenticate Your Server

First, authenticate your Yahoo Fantasy MCP server:

1. Visit your deployed server: `https://yahoo-mcp-production.up.railway.app/`
2. Click **"Authenticate with Yahoo"**
3. Sign in and authorize the application
4. Your tokens will be saved automatically

### 2. Install MCP Client Node in n8n

If you're using self-hosted n8n:

1. Go to **Settings** → **Community Nodes**
2. Search for `n8n-nodes-mcp`
3. Install the package (use the one by Nerding.io)
4. Restart n8n

For n8n Cloud, the MCP Client should be available by default.

### 3. Configure MCP Client Node

Add an **MCP Client** node to your n8n workflow and configure:

**Connection Settings:**
- **Connection Type**: `Server-Sent Events (SSE)`
- **Server URL**: `https://yahoo-mcp-production.up.railway.app/mcp`

**Operation**: Choose from:
- `List Tools` - Get available Yahoo Fantasy tools
- `Execute Tool` - Call a specific tool
- `Initialize` - Initialize MCP connection

### 4. Example Workflows

#### Example 1: List All Tools

```
MCP Client Node:
  - Operation: List Tools
  - Connection: SSE
  - Server URL: https://yahoo-mcp-production.up.railway.app/mcp
```

This returns all available Yahoo Fantasy tools (get_user_leagues, get_team_roster, etc.)

#### Example 2: Get Your NFL Leagues

```
MCP Client Node:
  - Operation: Execute Tool
  - Tool Name: get_user_leagues
  - Arguments: 
    {
      "gameKey": "nfl"
    }
```

#### Example 3: Get League Standings

```
MCP Client Node:
  - Operation: Execute Tool
  - Tool Name: get_league_standings
  - Arguments:
    {
      "leagueKey": "423.l.YOUR_LEAGUE_ID"
    }
```

#### Example 4: Add a Player

```
MCP Client Node:
  - Operation: Execute Tool
  - Tool Name: add_player
  - Arguments:
    {
      "leagueKey": "423.l.YOUR_LEAGUE_ID",
      "teamKey": "423.l.YOUR_LEAGUE_ID.t.1",
      "playerKey": "423.p.PLAYER_ID"
    }
```

## Available Endpoints

Your deployed server provides these endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Web UI and authentication status |
| `/oauth/start` | GET | Start OAuth flow |
| `/oauth/callback` | GET | OAuth callback (automatic) |
| `/health` | GET | Health check and server status |
| `/mcp` | GET | MCP SSE endpoint (for n8n) |
| `/mcp/message` | POST | JSON-RPC message endpoint |

## MCP Protocol Details

The server uses JSON-RPC 2.0 protocol. Example requests:

### Initialize Connection

```json
POST /mcp/message

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {}
}
```

### List Tools

```json
POST /mcp/message

{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

### Execute Tool

```json
POST /mcp/message

{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "get_user_leagues",
    "arguments": {
      "gameKey": "nfl"
    }
  }
}
```

## Common Yahoo Fantasy Tools

Here are the most commonly used tools:

### User & League Management
- `get_user_leagues` - Get your leagues for a sport
- `get_league_standings` - Get league standings
- `get_league_settings` - Get league settings
- `get_league_scoreboard` - Get matchups

### Team Management
- `get_team_roster` - Get team roster
- `get_team_matchups` - Get team matchups
- `get_team_stats` - Get team statistics

### Player Management
- `get_player_stats` - Get player statistics
- `get_free_agents` - Get available free agents
- `search_players` - Search for players
- `get_player_ownership` - Check player ownership

### Transactions
- `add_player` - Add a free agent
- `drop_player` - Drop a player
- `add_drop_players` - Add and drop in one transaction
- `propose_trade` - Propose a trade
- `accept_trade` - Accept a trade
- `reject_trade` - Reject a trade

## Workflow Examples

### Automated Waiver Wire Bot

Create a workflow that:
1. **Scheduled Trigger** - Runs daily at midnight
2. **MCP Client** - Get free agents by position
3. **Filter** - Find players above performance threshold
4. **MCP Client** - Add top player to your team

### League Standings Monitor

Create a workflow that:
1. **Scheduled Trigger** - Runs every Monday morning
2. **MCP Client** - Get league standings
3. **Filter** - Check your team's rank
4. **Email/Slack** - Send weekly update

### Trade Analyzer

Create a workflow that:
1. **Webhook Trigger** - Manual trigger
2. **MCP Client** - Get player stats for multiple players
3. **Code Node** - Calculate trade value
4. **MCP Client** - Propose trade if favorable

## Troubleshooting

### "MCP server not initialized" Error

**Cause**: The server hasn't been properly initialized or authenticated.

**Solution**:
1. Visit `https://yahoo-mcp-production.up.railway.app/`
2. Complete the OAuth authentication
3. Verify the "Authenticated" status is green

### "Not authenticated with Yahoo" Error

**Cause**: OAuth tokens are missing or expired.

**Solution**:
1. Re-authenticate at `https://yahoo-mcp-production.up.railway.app/oauth/start`
2. Tokens should be automatically saved
3. Restart your n8n workflow

### Connection Timeout

**Cause**: The Railway deployment might be cold-starting.

**Solution**:
1. Visit the web UI first to wake up the server
2. Try the request again after 5-10 seconds

### Invalid Tool Name

**Cause**: The tool name doesn't exist or is misspelled.

**Solution**:
1. Use the "List Tools" operation first
2. Copy the exact tool name from the response
3. Tool names are case-sensitive

## Advanced Usage

### Using with Other Tools

The MCP endpoints can be called from:
- **n8n** (MCP Client node)
- **Any HTTP client** (curl, Postman, etc.)
- **Custom applications** (via JSON-RPC)
- **Other AI agents** (Claude Desktop, Cursor, etc.)

### Direct HTTP Testing

Test with curl:

```bash
# List tools
curl -X POST https://yahoo-mcp-production.up.railway.app/mcp/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'

# Get your leagues
curl -X POST https://yahoo-mcp-production.up.railway.app/mcp/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_user_leagues",
      "arguments": {"gameKey": "nfl"}
    }
  }'
```

### Environment Variables

For Railway deployment, set these environment variables:

```env
YAHOO_CONSUMER_KEY=your_key
YAHOO_CONSUMER_SECRET=your_secret
OAUTH_CALLBACK_URL=https://yahoo-mcp-production.up.railway.app/oauth/callback
PORT=3000
```

After OAuth authentication, these are auto-saved:
```env
YAHOO_ACCESS_TOKEN=auto_generated
YAHOO_ACCESS_TOKEN_SECRET=auto_generated
YAHOO_SESSION_HANDLE=auto_generated
```

## Resources

- [Yahoo Fantasy API Documentation](https://developer.yahoo.com/fantasysports/guide/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [n8n Documentation](https://docs.n8n.io/)
- [Full API Reference](API_DOCUMENTATION.md)

## Support

If you encounter issues:

1. Check the server health: `https://yahoo-mcp-production.up.railway.app/health`
2. Verify authentication status at the home page
3. Review Railway logs for errors
4. Check that your Yahoo Developer App settings match your callback URL

---

**Ready to automate your fantasy league? Start building workflows!** 🚀
