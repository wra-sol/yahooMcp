# Quick Start Guide - Yahoo Fantasy MCP Server

Get up and running in 5 minutes!

## Prerequisites

- ✅ [Bun](https://bun.sh/) installed (faster than Node.js!)
- ✅ A Yahoo account
- ✅ 5 minutes of your time

### Install Bun First

```bash
# macOS/Linux/WSL
curl -fsSL https://bun.sh/install | bash
```

## Step 1: Clone and Install (1 minute)

```bash
git clone <repository-url>
cd yahooMcp
bun install
```

## Step 2: Create Yahoo Developer App (2 minutes)

1. Go to https://developer.yahoo.com/apps/create/
2. Sign in with your Yahoo account
3. Fill in the form:
   - **Application Name**: "My Fantasy Bot" (or anything you like)
   - **Application Type**: Web Application
   - **Redirect URI**: 
     - For Railway/hosted: `https://yahoo-mcp-production.up.railway.app/oauth/callback`
     - For local development: `http://localhost:3000/oauth/callback` or try `oob`
   - **API Permissions**: Check "Fantasy Sports" with "Read/Write"
4. Click **Create App**
5. **Copy** your Consumer Key and Consumer Secret

## Step 3: Set Up Environment (30 seconds)

```bash
cp env.example .env
```

Edit `.env` and paste your credentials:

```bash
YAHOO_CONSUMER_KEY=paste_your_consumer_key_here
YAHOO_CONSUMER_SECRET=paste_your_consumer_secret_here

# Set this to match your Yahoo Developer App redirect URI
# For Railway: https://yahoo-mcp-production.up.railway.app/oauth/callback
# For local: oob or http://localhost:3000/oauth/callback
OAUTH_CALLBACK_URL=oob
```

## Step 4: Authenticate (30 seconds)

```bash
bun start
```

The server will start and show:

```
✅ HTTP OAuth server running on http://localhost:3000
   Visit http://localhost:3000 to authenticate
```

1. Open `http://localhost:3000` in your browser
2. Click **"Authenticate with Yahoo"**
3. Sign in and click **"Agree"**
4. You'll be redirected back automatically

**Done!** Your tokens are saved to `.oauth-tokens.json` and auto-loaded on restart.

## Step 5: Test It Out (30 seconds)

The server is now running! Try making a request:

### Get Your NFL Leagues

```json
{
  "tool": "get_user_leagues",
  "arguments": {
    "gameKey": "nfl"
  }
}
```

### Get League Standings

```json
{
  "tool": "get_league_standings",
  "arguments": {
    "leagueKey": "YOUR_LEAGUE_KEY_HERE"
  }
}
```

### Search for Players

```json
{
  "tool": "search_players",
  "arguments": {
    "gameKey": "nfl",
    "filters": {
      "search": "mahomes",
      "count": 5
    }
  }
}
```

## Common First Tasks

### 1. Find Your League Key

```json
{
  "tool": "get_user_leagues",
  "arguments": { "gameKey": "nfl" }
}
```

Look for `league_key` in the response (e.g., `"423.l.123456"`).

### 2. Find Your Team Key

```json
{
  "tool": "get_league_teams",
  "arguments": { "leagueKey": "423.l.123456" }
}
```

Look for your team's `team_key` (e.g., `"423.l.123456.t.1"`).

### 3. Get Free Agents

```json
{
  "tool": "get_free_agents",
  "arguments": {
    "leagueKey": "423.l.123456",
    "position": "QB",
    "count": 10
  }
}
```

### 4. Add a Player

```json
{
  "tool": "add_player",
  "arguments": {
    "leagueKey": "423.l.123456",
    "teamKey": "423.l.123456.t.1",
    "playerKey": "423.p.31023"
  }
}
```

## Troubleshooting

### "Authentication failed" Error

Your token expired. Delete tokens and re-authenticate:

```bash
# Delete the token lines from .env
# Keep only YAHOO_CONSUMER_KEY and YAHOO_CONSUMER_SECRET
# Then restart:
npm start
```

### "Invalid league key" Error

Make sure your league key is in the format: `{game_id}.l.{league_id}`

Example: `423.l.123456` (NOT just `123456`)

### Can't Find My League

Try:

```json
{
  "tool": "get_user_games",
  "arguments": {}
}
```

This shows all games you're in, then use the game key to get leagues.

## Next Steps

- 📖 Read the [Full README](README.md) for all features
- 📚 Check [API Documentation](API_DOCUMENTATION.md) for complete tool reference
- 🔗 See [n8n Setup Guide](N8N_SETUP.md) for workflow automation
- 🔧 Review [Integration Guide](INTEGRATION_GUIDE.md) for all integration options
- 🔍 Explore [Example Usage](src/test/example.ts) for more examples

## Integration Options

### Use with n8n (Workflow Automation)

Perfect for automating fantasy league management:

```
1. Deploy to Railway: https://yahoo-mcp-production.up.railway.app/
2. Authenticate via web UI
3. In n8n: Add MCP Client node
4. Set Server URL: https://yahoo-mcp-production.up.railway.app/mcp
5. Build workflows!
```

See [N8N_SETUP.md](N8N_SETUP.md) for complete instructions.

### Use with Cursor/Claude Desktop (Local AI)

Perfect for local development and AI assistance:

```
1. Run locally: bun start
2. Set USE_STDIO=true
3. Configure in Cursor/Claude Desktop settings
4. Access via AI chat!
```

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for complete instructions.

## Quick Reference Card

### Key Formats

```
Game:        nfl, mlb, nba, nhl (use these for current season)
League:      449.l.123456 (game_id.l.league_id)
Team:        449.l.123456.t.1 (game_id.l.league_id.t.team_id)
Player:      449.p.31023 (game_id.p.player_id)
Transaction: 449.l.123456.tr.2 (game_id.l.league_id.tr.trans_id)
```

### Common Tools

| Task | Tool |
|------|------|
| Get your leagues | `get_user_leagues` |
| Get standings | `get_league_standings` |
| Search players | `search_players` |
| Get free agents | `get_free_agents` |
| Add player | `add_player` |
| Drop player | `drop_player` |
| Propose trade | `propose_trade` |
| Get roster | `get_team_roster` |

### Sport Codes

| Sport | Code | Example Game ID |
|-------|------|-----------------|
| NFL | `nfl` | `449` (2024) |
| MLB | `mlb` | `448` (2025) |
| NBA | `nba` | `450` (2024-25) |
| NHL | `nhl` | `451` (2024-25) |

**Tip:** Always use the sport code (e.g., `"nfl"`) rather than the game ID to automatically get current season data.

---

**Need help?** Check the [full documentation](README.md) or [Yahoo API docs](https://developer.yahoo.com/fantasysports/guide/)

**Ready to dive deeper?** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for all 54 tools!

