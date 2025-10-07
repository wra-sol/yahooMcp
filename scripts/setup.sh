#!/bin/bash

# Yahoo Fantasy MCP Server Setup Script

echo "🏈 Yahoo Fantasy MCP Server Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Project built successfully"
echo ""

# Check for environment variables
echo "🔑 Checking environment variables..."

if [ -z "$YAHOO_CONSUMER_KEY" ]; then
    echo "⚠️  YAHOO_CONSUMER_KEY not set"
    MISSING_VARS=true
fi

if [ -z "$YAHOO_CONSUMER_SECRET" ]; then
    echo "⚠️  YAHOO_CONSUMER_SECRET not set"
    MISSING_VARS=true
fi

if [ -z "$YAHOO_ACCESS_TOKEN" ]; then
    echo "⚠️  YAHOO_ACCESS_TOKEN not set"
    MISSING_VARS=true
fi

if [ -z "$YAHOO_ACCESS_TOKEN_SECRET" ]; then
    echo "⚠️  YAHOO_ACCESS_TOKEN_SECRET not set"
    MISSING_VARS=true
fi

if [ "$MISSING_VARS" = true ]; then
    echo ""
    echo "❌ Missing required environment variables"
    echo ""
    echo "To get your Yahoo API credentials:"
    echo "1. Go to https://developer.yahoo.com/"
    echo "2. Create a new application"
    echo "3. Select 'Fantasy Sports' with Read/Write permissions"
    echo "4. Copy your Consumer Key and Consumer Secret"
    echo ""
    echo "Set the environment variables:"
    echo "export YAHOO_CONSUMER_KEY=\"your_consumer_key\""
    echo "export YAHOO_CONSUMER_SECRET=\"your_consumer_secret\""
    echo "export YAHOO_ACCESS_TOKEN=\"your_access_token\""
    echo "export YAHOO_ACCESS_TOKEN_SECRET=\"your_access_token_secret\""
    echo "export YAHOO_SESSION_HANDLE=\"your_session_handle\""
    echo ""
    echo "Or copy env.example to .env and fill in your values:"
    echo "cp env.example .env"
    echo ""
    exit 1
fi

echo "✅ All environment variables are set"
echo ""

echo "🎉 Setup completed successfully!"
echo ""
echo "To start the MCP server:"
echo "  npm start"
echo ""
echo "For development:"
echo "  npm run dev"
echo ""
echo "For more information, see README.md"
