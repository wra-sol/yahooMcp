# Deployment Guide - Yahoo Fantasy MCP Server

This guide covers deploying your Yahoo Fantasy MCP Server to Railway.app using Bun.

## 🚂 Railway Deployment

### Prerequisites

1. A [Railway](https://railway.app/) account
2. Your Yahoo Developer App credentials
3. This repository

### Step 1: Initial Setup

1. **Create a new Railway project**
   ```bash
   # Install Railway CLI (optional)
   npm install -g @railway/cli
   
   # Login
   railway login
   ```

2. **Or use the Railway web interface:**
   - Go to [railway.app](https://railway.app/)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

### Step 2: Configure Yahoo Developer App

1. Go to [Yahoo Developer Console](https://developer.yahoo.com/apps/)
2. Edit your application
3. Set **Redirect URI** to:
   ```
   https://yahoo-mcp-production.up.railway.app/oauth/callback
   ```
   (Replace `yahoo-mcp-production` with your actual Railway domain)

### Step 3: Set Environment Variables

In Railway dashboard, add these environment variables:

```bash
YAHOO_CONSUMER_KEY=your_consumer_key_here
YAHOO_CONSUMER_SECRET=your_consumer_secret_here
OAUTH_CALLBACK_URL=https://yahoo-mcp-production.up.railway.app/oauth/callback
PORT=3000
```

**Important:** Do NOT set the access tokens yet - we'll get them through OAuth.

### Step 4: Deploy

Railway will automatically:
1. Detect Bun from `nixpacks.toml`
2. Run `bun install`
3. Start the server with `bun start`

### Step 5: Authenticate

1. Visit your Railway URL: `https://yahoo-mcp-production.up.railway.app`
2. Click "Authenticate with Yahoo"
3. Sign in and authorize
4. Tokens will be saved to the Railway volume

### Step 6: Add Tokens to Environment Variables (Optional)

For persistence across deployments, copy the tokens from the success page and add them to Railway environment variables:

```bash
YAHOO_ACCESS_TOKEN=<from success page>
YAHOO_ACCESS_TOKEN_SECRET=<from success page>
YAHOO_SESSION_HANDLE=<from success page>
```

## 🔧 Configuration Options

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `YAHOO_CONSUMER_KEY` | ✅ Yes | From Yahoo Developer Console |
| `YAHOO_CONSUMER_SECRET` | ✅ Yes | From Yahoo Developer Console |
| `OAUTH_CALLBACK_URL` | ✅ Yes | Your Railway URL + `/oauth/callback` |
| `PORT` | ❌ No | Server port (Railway sets this automatically) |
| `HTTP_MODE` | ❌ No | Set to `true` for HTTP-only mode |
| `YAHOO_ACCESS_TOKEN` | ⚠️ Recommended | Obtained via OAuth flow |
| `YAHOO_ACCESS_TOKEN_SECRET` | ⚠️ Recommended | Obtained via OAuth flow |
| `YAHOO_SESSION_HANDLE` | ⚠️ Recommended | For token refresh |

### Running in HTTP-Only Mode

If you only want the HTTP server (no MCP stdio):

```bash
HTTP_MODE=true
```

This is useful for:
- Testing OAuth flow
- Running as a web service
- Debugging without MCP clients

### Custom Port

Railway automatically sets `PORT`, but for local testing:

```bash
PORT=8080
```

## 📝 Railway-Specific Files

### `nixpacks.toml`

Tells Railway to use Bun:

```toml
[phases.setup]
nixPkgs = ["...", "bun"]

[phases.install]
cmds = ["bun install"]

[start]
cmd = "bun start"
```

### `railway.json`

Railway configuration:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "bun install"
  },
  "deploy": {
    "startCommand": "bun start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## 🔒 Security Best Practices

### 1. Token Storage

- ✅ Store tokens in Railway environment variables
- ✅ Use `.oauth-tokens.json` for development only
- ❌ Never commit `.oauth-tokens.json` to git
- ❌ Never expose tokens in logs or responses

### 2. HTTPS

- ✅ Railway provides HTTPS by default
- ✅ Use HTTPS callback URLs for production
- ⚠️ HTTP is OK for localhost development

### 3. Environment Variables

```bash
# Production (Railway)
OAUTH_CALLBACK_URL=https://your-app.up.railway.app/oauth/callback

# Development (Local)
OAUTH_CALLBACK_URL=http://localhost:3000/oauth/callback
```

## 🐛 Troubleshooting

### "Invalid callback URL" error

**Solution:** Make sure your Railway URL matches exactly in:
1. Yahoo Developer Console redirect URI
2. `OAUTH_CALLBACK_URL` environment variable

### Tokens not persisting

**Solution:** Add tokens to Railway environment variables:
1. Complete OAuth flow
2. Copy tokens from success page
3. Add to Railway env vars
4. Redeploy

### "Port already in use"

**Solution:** Railway sets `PORT` automatically. Don't override it.

### MCP server not starting

**Solution:** Make sure you have valid access tokens. Check Railway logs:

```bash
railway logs
```

## 🎯 Using with MCP Clients

Once deployed, you can use the server with MCP clients:

### For Claude Desktop

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "yahoo-fantasy": {
      "command": "bunx",
      "args": ["yahoo-fantasy-mcp"],
      "env": {
        "YAHOO_CONSUMER_KEY": "your_key",
        "YAHOO_CONSUMER_SECRET": "your_secret",
        "YAHOO_ACCESS_TOKEN": "your_token",
        "YAHOO_ACCESS_TOKEN_SECRET": "your_token_secret"
      }
    }
  }
}
```

### For Other MCP Clients

The server communicates via stdio when tokens are configured. Make sure:
1. Environment variables are set
2. Server starts in MCP mode (not HTTP-only)

## 📊 Monitoring

### Health Check Endpoint

```
GET https://your-app.up.railway.app/health
```

Response:
```json
{
  "status": "ok",
  "authenticated": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Railway Metrics

Monitor your deployment:
- CPU usage
- Memory usage
- Request logs
- Error rates

## 🔄 Token Refresh

Tokens expire after some time. The server automatically refreshes them using the session handle.

If refresh fails:
1. Visit your Railway URL
2. Re-authenticate via `/oauth/start`
3. Update environment variables with new tokens

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Bun Documentation](https://bun.sh/docs)
- [Yahoo Fantasy API](https://developer.yahoo.com/fantasysports/guide/)
- [MCP Protocol](https://modelcontextprotocol.io/)

## 💡 Tips

1. **Use Railway volumes** for persistent storage (coming soon)
2. **Set up Railway notifications** for deployment updates
3. **Monitor logs** regularly for OAuth issues
4. **Keep session handle** for token refresh
5. **Test locally first** before deploying to Railway

---

**Need help?** Open an issue on GitHub or check the main [README](README.md).
