# Yahoo Fantasy MCP Server - Architecture

## Overview

This server implements the **Model Context Protocol (MCP)** using the official TypeScript SDK, providing 40+ tools for interacting with the Yahoo Fantasy Sports API.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Yahoo Fantasy MCP Server                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │  HTTP Server     │        │   MCP Server     │          │
│  │  (Bun Native)    │◄──────►│  (Official SDK)  │          │
│  │                  │        │                  │          │
│  │  • OAuth Flow    │        │  • SSE Transport │          │
│  │  • /mcp          │        │  • 40+ Tools     │          │
│  │  • /mcp/messages │        │  • MCP v2024-11  │          │
│  └──────────────────┘        └──────────────────┘          │
│           │                           │                     │
│           │                           │                     │
│           ▼                           ▼                     │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │  OAuth Client    │        │  Fantasy Tools   │          │
│  │  (Yahoo OAuth2)  │        │  (40+ methods)   │          │
│  └──────────────────┘        └──────────────────┘          │
│           │                           │                     │
│           └───────────┬───────────────┘                     │
│                       │                                     │
│                       ▼                                     │
│           ┌──────────────────────┐                          │
│           │   Yahoo Fantasy API   │                          │
│           └──────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. HTTP Server (`src/server/http-server.ts`)

**Purpose**: Handles OAuth authentication and MCP transport

**Key Features**:
- OAuth 2.0 flow with Yahoo
- Automatic token refresh
- Official MCP SSE transport
- Session management

**Endpoints**:
- `GET /` - Web UI for OAuth
- `GET /oauth/start` - Start OAuth flow
- `GET /oauth/callback` - OAuth callback
- `GET /health` - Health check
- `GET /mcp` - **MCP SSE endpoint**
- `POST /mcp/messages` - **MCP messages**

### 2. MCP Server (`src/server/mcp-server.ts`)

**Purpose**: Implements MCP protocol using official SDK

**Key Features**:
- Uses `McpServer` from `@modelcontextprotocol/sdk`
- Implements MCP v2024-11-05
- Handles tool list/call requests
- Manages credentials

**Transport**: `SSEServerTransport` (official)

### 3. Fantasy Tools (`src/tools/fantasy-tools.ts`)

**Purpose**: Yahoo Fantasy Sports tool implementations

**Categories**:
- **User & Games**: Profile, leagues, teams
- **League Management**: Settings, standings, teams
- **Team Operations**: Roster, matchups, stats
- **Player Information**: Stats, ownership, notes
- **Transactions**: Add/drop, trades, waivers
- **Search & Discovery**: Free agents, player search

**Total Tools**: 40+

### 4. Yahoo API Client (`src/api/yahoo-fantasy-client.ts`)

**Purpose**: Direct API communication with Yahoo

**Key Features**:
- OAuth 1.0a signing
- Automatic token refresh
- Error handling with custom error types
- Rate limit management

## MCP Protocol Implementation

### Connection Flow

```
1. Client connects to SSE endpoint
   ↓
2. Server creates SSEServerTransport
   ↓
3. Server connects MCP Server to transport
   ↓
4. Client receives session ID
   ↓
5. Client sends JSON-RPC messages
   ↓
6. Server processes and responds via SSE
```

### Message Format

**Request** (JSON-RPC 2.0):
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [...]
  }
}
```

## Standards Compliance

### MCP Protocol
- ✅ Version: 2024-11-05 (latest)
- ✅ Transport: SSEServerTransport (official)
- ✅ JSON-RPC 2.0 messaging
- ✅ Tool schema validation

### SDK Usage
- ✅ `@modelcontextprotocol/sdk@1.20.0`
- ✅ `McpServer` class
- ✅ Official transport classes
- ✅ Type-safe tool definitions

### OAuth
- ✅ OAuth 2.0 authorization code flow
- ✅ Automatic token refresh
- ✅ Secure token storage
- ✅ PKCE support

## Configuration

### Environment Variables

```bash
# Required
YAHOO_CONSUMER_KEY=your_key
YAHOO_CONSUMER_SECRET=your_secret

# Optional
YAHOO_ACCESS_TOKEN=token              # Pre-authenticated token
YAHOO_ACCESS_TOKEN_SECRET=secret      # Token secret
YAHOO_SESSION_HANDLE=handle           # Refresh handle
OAUTH_CALLBACK_URL=http://...         # OAuth callback URL
PORT=3000                             # HTTP server port
USE_STDIO=true                        # Use stdio instead of HTTP
HTTP_MODE=true                        # HTTP only, no MCP server
```

## Usage Examples

### n8n Integration

```javascript
// MCP Client Node Configuration
{
  "connectionType": "sse",
  "url": "http://localhost:3000/mcp",
  "operation": "executeTool",
  "toolName": "get_user_leagues",
  "parameters": {
    "gameKey": "nfl"
  }
}
```

### Claude Desktop

```json
{
  "mcpServers": {
    "yahoo-fantasy": {
      "command": "bun",
      "args": ["run", "/path/to/yahooMcp/src/index.ts"],
      "env": {
        "YAHOO_CONSUMER_KEY": "...",
        "YAHOO_CONSUMER_SECRET": "...",
        "USE_STDIO": "true"
      }
    }
  }
}
```

### Direct HTTP

```bash
# Connect to SSE
curl -N http://localhost:3000/mcp

# Send message
curl -X POST http://localhost:3000/mcp/messages?sessionId=abc-123 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

## Error Handling

### Custom Error Types

- `YahooFantasyError` - Base error
- `RosterLockedError` - Roster is locked
- `RosterConstraintError` - Position/roster violation
- `AuthenticationError` - Invalid/expired token
- `InsufficientPermissionsError` - Missing permissions
- `NetworkError` - Connection issues
- `RateLimitError` - API rate limit exceeded

### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "Detailed error message",
    "data": {
      "type": "ROSTER_LOCKED",
      "teamKey": "...",
      "recovery": "..."
    }
  }
}
```

## Performance

- **Bundle Size**: 0.83 MB (minified)
- **Startup Time**: < 1 second
- **Memory**: ~50 MB baseline
- **Transport**: Event-driven SSE (low overhead)

## Security

- OAuth tokens stored in `.oauth-tokens.json` (gitignored)
- Tokens encrypted in transit (HTTPS recommended)
- CORS enabled for web clients
- Session-based transport isolation

## Future Enhancements

### Potential Additions

1. **StreamableHTTPServerTransport**
   - Newer MCP transport (when stable)
   - Better performance
   - Bidirectional streaming

2. **Resource Support**
   - Expose league/team data as MCP resources
   - Enable content-based operations

3. **Prompts**
   - Pre-configured fantasy sports prompts
   - Strategy templates

4. **Caching Layer**
   - Redis/KV for frequently accessed data
   - Reduce Yahoo API calls

## Development

### Building

```bash
bun run build:bundle      # Bundle for distribution
bun run build            # Compile executable
bun run build:all        # Multi-platform builds
```

### Testing

```bash
bun test                 # Run test suite
bun run test:mcp         # Test MCP integration
```

### Linting

```bash
bun run lint             # Run ESLint
```

## References

- [MCP Specification](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Yahoo Fantasy API](https://developer.yahoo.com/fantasysports/guide/)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)

---

**Last Updated**: October 2025  
**MCP Version**: 2024-11-05  
**SDK Version**: 1.20.0

