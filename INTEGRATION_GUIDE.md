# Integration Guide - Yahoo Fantasy MCP Server

This guide covers all the ways you can integrate with the Yahoo Fantasy MCP Server.

## Overview

The Yahoo Fantasy MCP Server supports multiple integration methods:

1. **Local MCP Clients** (Cursor, Claude Desktop) - via stdio transport
2. **Remote Clients** (n8n, web apps) - via HTTP/JSON-RPC
3. **Direct HTTP API** - via REST endpoints

## Table of Contents

- [n8n Integration](#n8n-integration)
- [Cursor/Claude Desktop Integration](#cursorclaude-desktop-integration)
- [Direct HTTP Integration](#direct-http-integration)
- [Environment Configuration](#environment-configuration)
- [Deployment Options](#deployment-options)

## n8n Integration

### Setup

1. **Deploy the server** to Railway, Heroku, or run locally
2. **Authenticate** at `https://your-server.com/` 
3. **Add MCP Client node** in your n8n workflow
4. **Configure the node**:
   - **Connection Type**: `Server-Sent Events (SSE)`
   - **Server URL**: `https://your-server.com/mcp`

### Available Operations

- **List Tools** - Get all available Yahoo Fantasy tools
- **Execute Tool** - Call a specific tool with parameters
- **Initialize** - Initialize the MCP connection

### Example Workflow

```
Trigger (Schedule: Daily at 2 AM)
  ↓
MCP Client: List Tools
  ↓
MCP Client: Execute Tool
  - Tool: get_free_agents
  - Arguments: { "leagueKey": "423.l.12345", "position": "WR" }
  ↓
Filter: Top 5 players by projected points
  ↓
MCP Client: Execute Tool
  - Tool: add_player
  - Arguments: { "teamKey": "...", "playerKey": "..." }
  ↓
Email/Slack: Send confirmation
```

📖 **Detailed Guide**: See [N8N_SETUP.md](N8N_SETUP.md)

## Cursor/Claude Desktop Integration

### Setup

1. **Run server locally** with stdio transport
2. **Set environment variable**: `USE_STDIO=true`
3. **Configure MCP client** in your editor/app

### Cursor Configuration

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "yahoo-fantasy": {
      "command": "bun",
      "args": ["run", "/Users/your-username/yahooMcp/src/index.ts"],
      "env": {
        "USE_STDIO": "true",
        "YAHOO_CONSUMER_KEY": "your_key",
        "YAHOO_CONSUMER_SECRET": "your_secret",
        "YAHOO_ACCESS_TOKEN": "your_token",
        "YAHOO_ACCESS_TOKEN_SECRET": "your_token_secret"
      }
    }
  }
}
```

### Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "yahoo-fantasy": {
      "command": "bun",
      "args": ["run", "/Users/your-username/yahooMcp/src/index.ts"],
      "env": {
        "USE_STDIO": "true",
        "YAHOO_CONSUMER_KEY": "your_key",
        "YAHOO_CONSUMER_SECRET": "your_secret",
        "YAHOO_ACCESS_TOKEN": "your_token",
        "YAHOO_ACCESS_TOKEN_SECRET": "your_token_secret"
      }
    }
  }
}
```

### Using a Compiled Binary

For better performance, compile to a standalone binary:

```bash
bun run build
```

Then use in config:

```json
{
  "mcpServers": {
    "yahoo-fantasy": {
      "command": "/Users/your-username/yahooMcp/yahoo-mcp",
      "env": {
        "USE_STDIO": "true",
        "YAHOO_CONSUMER_KEY": "...",
        "YAHOO_CONSUMER_SECRET": "...",
        "YAHOO_ACCESS_TOKEN": "...",
        "YAHOO_ACCESS_TOKEN_SECRET": "..."
      }
    }
  }
}
```

## Direct HTTP Integration

### Endpoints

The server exposes these HTTP endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Web UI and status |
| `/oauth/start` | GET | Start OAuth flow |
| `/oauth/callback` | GET | OAuth callback |
| `/health` | GET | Health check |
| `/mcp` | GET | MCP SSE endpoint |
| `/mcp/message` | POST | JSON-RPC endpoint |

### JSON-RPC Protocol

The `/mcp/message` endpoint accepts JSON-RPC 2.0 requests:

#### Initialize

```bash
curl -X POST https://your-server.com/mcp/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {}
  }'
```

Response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": {} },
    "serverInfo": {
      "name": "yahoo-fantasy-mcp",
      "version": "1.0.0"
    }
  }
}
```

#### List Tools

```bash
curl -X POST https://your-server.com/mcp/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

#### Execute Tool

```bash
curl -X POST https://your-server.com/mcp/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_user_leagues",
      "arguments": {
        "gameKey": "nfl"
      }
    }
  }'
```

Response:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{ \"leagues\": [...] }"
      }
    ]
  }
}
```

## Environment Configuration

### Required Variables

```env
# Yahoo Developer App credentials (required)
YAHOO_CONSUMER_KEY=your_consumer_key
YAHOO_CONSUMER_SECRET=your_consumer_secret

# OAuth callback URL (match your deployment)
OAUTH_CALLBACK_URL=http://localhost:3000/oauth/callback
# For Railway: https://your-app.up.railway.app/oauth/callback
```

### Optional Variables

```env
# Server configuration
PORT=3000                    # HTTP server port
HTTP_MODE=false              # Set to 'true' to disable MCP
USE_STDIO=false              # Set to 'true' for stdio transport

# OAuth tokens (auto-generated during authentication)
YAHOO_ACCESS_TOKEN=auto_generated
YAHOO_ACCESS_TOKEN_SECRET=auto_generated
YAHOO_SESSION_HANDLE=auto_generated
```

### Railway Deployment

Set in Railway dashboard:

```env
YAHOO_CONSUMER_KEY=your_key
YAHOO_CONSUMER_SECRET=your_secret
OAUTH_CALLBACK_URL=https://yahoo-mcp-production.up.railway.app/oauth/callback
```

After authentication, the tokens are auto-saved and persisted.

## Deployment Options

### Option 1: Railway (Recommended for n8n)

1. **Deploy** using the Railway button or CLI
2. **Set environment variables** in Railway dashboard
3. **Authenticate** via the web UI
4. **Use** the public URL in n8n: `https://your-app.up.railway.app/mcp`

**Pros**: Always online, free tier available, auto-scaling
**Cons**: Cold starts possible

### Option 2: Local Development

1. **Run** `bun start` locally
2. **Authenticate** at `http://localhost:3000`
3. **Use** for local MCP clients or development

**Pros**: Fast, no cold starts, full control
**Cons**: Not accessible remotely

### Option 3: Docker

```dockerfile
FROM oven/bun:latest

WORKDIR /app
COPY . .
RUN bun install

ENV PORT=3000
EXPOSE 3000

CMD ["bun", "start"]
```

```bash
docker build -t yahoo-mcp .
docker run -p 3000:3000 \
  -e YAHOO_CONSUMER_KEY=your_key \
  -e YAHOO_CONSUMER_SECRET=your_secret \
  yahoo-mcp
```

**Pros**: Portable, consistent environment
**Cons**: Requires Docker knowledge

### Option 4: Heroku

```bash
heroku create your-app-name
heroku config:set YAHOO_CONSUMER_KEY=your_key
heroku config:set YAHOO_CONSUMER_SECRET=your_secret
heroku config:set OAUTH_CALLBACK_URL=https://your-app-name.herokuapp.com/oauth/callback
git push heroku main
```

**Pros**: Easy deployment, good uptime
**Cons**: Paid plans required for always-on

## Authentication Flow

### Initial Setup

1. **Create Yahoo Developer App** at https://developer.yahoo.com/
2. **Set redirect URI** to match your deployment
3. **Copy** Consumer Key and Secret
4. **Set** environment variables

### Web Authentication

1. Visit your server's URL (e.g., `https://your-app.com/`)
2. Click "Authenticate with Yahoo"
3. Sign in and authorize
4. Tokens are automatically saved

### Token Persistence

- **Local**: Saved to `.oauth-tokens.json`
- **Railway/Heroku**: Stored in environment (set manually after first auth)
- **Auto-refresh**: Tokens refresh automatically when expired

## Usage Examples

### Get Your NFL Leagues

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_user_leagues",
    "arguments": { "gameKey": "nfl" }
  }
}
```

### Get League Standings

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_league_standings",
    "arguments": { "leagueKey": "423.l.123456" }
  }
}
```

### Add Free Agent

```json
{
  "method": "tools/call",
  "params": {
    "name": "add_player",
    "arguments": {
      "leagueKey": "423.l.123456",
      "teamKey": "423.l.123456.t.1",
      "playerKey": "423.p.31023"
    }
  }
}
```

### Search Players

```json
{
  "method": "tools/call",
  "params": {
    "name": "search_players",
    "arguments": {
      "gameKey": "nfl",
      "filters": {
        "search": "mahomes",
        "position": "QB",
        "count": 5
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

**"MCP server not initialized"**
- Ensure tokens are set in environment
- Re-authenticate via web UI

**"Not authenticated with Yahoo"**
- OAuth tokens expired or missing
- Visit `/oauth/start` to re-authenticate

**Connection timeout**
- Server may be cold-starting (Railway)
- Visit home page to wake server
- Wait 5-10 seconds and retry

**Invalid tool name**
- Use `tools/list` to get exact names
- Tool names are case-sensitive

### Health Check

Check server status:

```bash
curl https://your-server.com/health
```

Response:
```json
{
  "status": "ok",
  "authenticated": true,
  "timestamp": "2024-10-07T12:00:00.000Z",
  "server": "Bun native HTTP",
  "mcpEnabled": true,
  "mcpEndpoint": "/mcp"
}
```

## Resources

- [n8n Setup Guide](N8N_SETUP.md) - Detailed n8n integration
- [Quick Start Guide](QUICKSTART.md) - Get started in 5 minutes
- [API Documentation](API_DOCUMENTATION.md) - Complete tool reference
- [README](README.md) - Full documentation

## Support

For issues:

1. Check `/health` endpoint
2. Review server logs
3. Verify environment variables
4. Check Yahoo Developer App settings
5. Open an issue on GitHub

---

**Ready to integrate? Choose your platform and get started!** 🚀
