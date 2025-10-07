# Quick Start Guide - Yahoo Fantasy MCP Server

Get up and running in 5 minutes!

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ A Yahoo account
- ✅ 5 minutes of your time

## Step 1: Clone and Install (1 minute)

```bash
git clone <repository-url>
cd yahooMcp
npm install
npm run build
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

## Step 4: Authenticate (1 minute)

```bash
npm start
```

Follow the prompts:

1. Open the URL shown in your browser
2. Click **Agree** to authorize the app
3. Copy the verification code from the URL
4. Paste it into the terminal
5. Press Enter

**Done!** Your tokens are now saved.

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
- 🔍 Explore [Example Usage](src/test/example.ts) for more examples

## Quick Reference Card

### Key Formats

```
Game:        nfl, mlb, nba, nhl
League:      423.l.123456
Team:        423.l.123456.t.1
Player:      423.p.31023
Transaction: 423.l.123456.tr.2
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

| Sport | Code | 2024 Game ID |
|-------|------|--------------|
| NFL | `nfl` | `423` |
| MLB | `mlb` | `422` |
| NBA | `nba` | `424` |
| NHL | `nhl` | `425` |

---

**Need help?** Check the [full documentation](README.md) or [Yahoo API docs](https://developer.yahoo.com/fantasysports/guide/)

**Ready to dive deeper?** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for all 49+ tools!

