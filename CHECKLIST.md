# ✅ Setup Checklist

Use this checklist to get your Yahoo Fantasy MCP Server up and running!

## 📋 Pre-Setup

- [ ] Read [SETUP_SUMMARY.md](SETUP_SUMMARY.md)
- [ ] Have your Yahoo account ready
- [ ] 10 minutes of free time

## 🔧 Step 1: Install Bun

- [ ] Install Bun:
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
- [ ] Verify installation:
  ```bash
  bun --version
  ```

## 📦 Step 2: Install Dependencies

- [ ] Navigate to project:
  ```bash
  cd yahooMcp
  ```
- [ ] Install dependencies:
  ```bash
  bun install
  ```
- [ ] Verify no errors in installation

## 🔑 Step 3: Yahoo Developer Setup

- [ ] Go to https://developer.yahoo.com/apps/create/
- [ ] Sign in with Yahoo account
- [ ] Click "Create an App"
- [ ] Fill in application details:
  - [ ] Application Name: `Yahoo Fantasy MCP`
  - [ ] Application Type: `Web Application`
  - [ ] **Redirect URI:** `http://localhost:3000/oauth/callback`
  - [ ] API Permissions: Check `Fantasy Sports` (Read/Write)
- [ ] Click "Create App"
- [ ] Copy Consumer Key
- [ ] Copy Consumer Secret

## ⚙️ Step 4: Environment Configuration

- [ ] Copy example env file:
  ```bash
  cp env.example .env
  ```
- [ ] Open `.env` in editor
- [ ] Paste `YAHOO_CONSUMER_KEY`
- [ ] Paste `YAHOO_CONSUMER_SECRET`
- [ ] Set `OAUTH_CALLBACK_URL=http://localhost:3000/oauth/callback`
- [ ] Save file

## 🚀 Step 5: Start Server

- [ ] Start the server:
  ```bash
  bun start
  ```
- [ ] Verify server starts without errors
- [ ] Check console shows:
  ```
  ✅ HTTP OAuth server running on http://localhost:3000
  ```

## 🔐 Step 6: Authenticate

- [ ] Open browser to http://localhost:3000
- [ ] Click "Authenticate with Yahoo"
- [ ] Sign in to Yahoo if prompted
- [ ] Click "Agree" to authorize
- [ ] Verify redirect back to success page
- [ ] Confirm tokens are displayed
- [ ] Verify `.oauth-tokens.json` file created

## ✅ Step 7: Verify Setup

- [ ] Restart server:
  ```bash
  # Ctrl+C to stop
  bun start
  ```
- [ ] Verify console shows:
  ```
  ✅ Loaded tokens from .oauth-tokens.json
  ✅ HTTP OAuth server running on http://localhost:3000
  🚀 Starting MCP server...
  Yahoo Fantasy MCP Server started
  ```
- [ ] Check health endpoint:
  ```bash
  curl http://localhost:3000/health
  ```
- [ ] Verify response shows `"authenticated": true`

## 🎯 Step 8: Test MCP Tools

- [ ] Set up MCP client (Claude Desktop, etc.)
- [ ] Configure client to use your server
- [ ] Test a simple tool call:
  ```json
  {
    "tool": "get_user_leagues",
    "arguments": { "gameKey": "nfl" }
  }
  ```
- [ ] Verify you get league data back

## 🌐 Optional: Deploy to Railway

Only if you want to deploy to production:

- [ ] Read [DEPLOYMENT.md](DEPLOYMENT.md)
- [ ] Create Railway account
- [ ] Connect GitHub repository
- [ ] Set Railway environment variables
- [ ] Update Yahoo Developer App redirect URI to Railway URL
- [ ] Deploy and test

## 🐛 Troubleshooting

If something doesn't work:

### Server won't start
- [ ] Check Bun is installed: `bun --version`
- [ ] Verify dependencies: `bun install`
- [ ] Check `.env` file exists and has keys

### Authentication fails
- [ ] Verify redirect URI in Yahoo matches `.env`
- [ ] Check consumer key/secret are correct
- [ ] Try deleting `.oauth-tokens.json` and re-auth

### Tokens not persisting
- [ ] Check `.oauth-tokens.json` exists
- [ ] Verify file has proper JSON format
- [ ] Check file permissions

### "Invalid callback" error
- [ ] Verify Yahoo Developer App redirect URI is **exactly**:
  `http://localhost:3000/oauth/callback`
- [ ] Verify `.env` has same URL in `OAUTH_CALLBACK_URL`
- [ ] No trailing slashes or extra characters

## 📚 Next Steps

Once everything is working:

- [ ] Read full [README.md](README.md)
- [ ] Explore [API Documentation](README.md#available-tools)
- [ ] Try different tool calls
- [ ] Build your fantasy sports assistant!
- [ ] Star the repo ⭐ (if you found it helpful)

## 💡 Pro Tips

- ✅ Keep your `.oauth-tokens.json` safe
- ✅ Add tokens to Railway env vars for production
- ✅ Use `bun run dev` for development (auto-reload)
- ✅ Monitor the health endpoint
- ✅ Check Railway logs for issues

## ✨ You're Done!

If all checkboxes are complete, you're ready to use the Yahoo Fantasy MCP Server!

**Happy fantasy sports! 🏈 ⚾ 🏀 🏒**

---

**Need help?** Check the [Troubleshooting](README.md#troubleshooting) section or open an issue.
