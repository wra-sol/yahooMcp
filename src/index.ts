#!/usr/bin/env bun

import { YahooFantasyMcpServer } from './server/mcp-server.js';
import { HttpOAuthServer } from './server/http-server.js';
import { OAuthCredentials } from './types/index.js';

/**
 * Yahoo Fantasy MCP Server
 * 
 * This server provides Model Context Protocol (MCP) tools for interacting
 * with the Yahoo Fantasy Sports API.
 * 
 * Features:
 * - HTTP server for OAuth authentication at http://localhost:3000
 * - MCP server with official SSE transport (MCP v2024-11-05)
 * - 40+ Yahoo Fantasy Sports tools for leagues, teams, players, and transactions
 * 
 * Setup:
 * 1. Register your application at https://developer.yahoo.com/
 * 2. Set redirect URI to match your OAUTH_CALLBACK_URL
 * 3. Set environment variables:
 *    - YAHOO_CONSUMER_KEY
 *    - YAHOO_CONSUMER_SECRET
 *    - OAUTH_CALLBACK_URL (defaults to http://localhost:3000/oauth/callback)
 * 4. Run: bun start
 * 5. Visit http://localhost:3000 to authenticate
 * 
 * MCP Integration:
 * - SSE Endpoint: GET /mcp
 * - Messages: POST /mcp/messages?sessionId=...
 * - Compatible with: n8n, Claude Desktop, Cursor, and other MCP clients
 */

async function main() {
  // Get credentials from environment variables
  const credentials: OAuthCredentials = {
    consumerKey: process.env.YAHOO_CONSUMER_KEY || '',
    consumerSecret: process.env.YAHOO_CONSUMER_SECRET || '',
    accessToken: process.env.YAHOO_ACCESS_TOKEN || '',
    accessTokenSecret: process.env.YAHOO_ACCESS_TOKEN_SECRET || '',
    sessionHandle: process.env.YAHOO_SESSION_HANDLE || '',
  };

  // Validate required credentials
  if (!credentials.consumerKey || !credentials.consumerSecret) {
    console.error('❌ Error: YAHOO_CONSUMER_KEY and YAHOO_CONSUMER_SECRET are required');
    console.error('');
    console.error('📝 Setup Instructions:');
    console.error('1. Go to https://developer.yahoo.com/');
    console.error('2. Create a new application');
    console.error(`3. Set redirect URI to: ${process.env.OAUTH_CALLBACK_URL || 'http://localhost:3000/oauth/callback'}`);
    console.error('4. Get your Consumer Key and Consumer Secret');
    console.error('5. Set environment variables:');
    console.error('');
    console.error('   export YAHOO_CONSUMER_KEY="your_consumer_key"');
    console.error('   export YAHOO_CONSUMER_SECRET="your_consumer_secret"');
    console.error(`   export OAUTH_CALLBACK_URL="${process.env.OAUTH_CALLBACK_URL || 'http://localhost:3000/oauth/callback'}"`);
    console.error('');
    process.exit(1);
  }

  const port = parseInt(process.env.PORT || '3000', 10);
  const useStdio = process.env.USE_STDIO === 'true';

  try {
    // Start HTTP server for OAuth (always runs)
    const httpServer = new HttpOAuthServer(credentials, port);
    await httpServer.start();

    // Get potentially updated credentials from loaded tokens
    const updatedCredentials = httpServer.getCredentials();
    const httpMode = process.env.HTTP_MODE === 'true';

    if (!httpMode && updatedCredentials.accessToken) {
      // Start MCP server if we have tokens and not in HTTP-only mode
      console.error('🚀 Starting MCP server...');
      
      // Get token save callback from HTTP server for automatic token persistence
      const tokenSaveCallback = httpServer.getTokenSaveCallback();
      
const mcpServer = new YahooFantasyMcpServer(updatedCredentials, tokenSaveCallback);
       
       // Set MCP server on HTTP server for SSE endpoint
       httpServer.setMcpServer(mcpServer);
      
if (useStdio) {
         // Use stdio transport (for local MCP clients like Cursor/Claude Desktop)
         await mcpServer.start();
         console.error('   MCP available via: stdio');
       } else {
         // Use SSE transport via HTTP (for remote clients like n8n)
         console.error('   MCP available via: Official SSE Transport');
         console.error(`   SSE Endpoint: http://localhost:${port}/mcp`);
         console.error(`   Messages: http://localhost:${port}/mcp/messages`);
         console.error('   Protocol: MCP v2024-11-05');
       }
    } else {
      console.error('');
      console.error('⚠️  No OAuth tokens found.');
      console.error(`   Visit http://localhost:${port} to authenticate with Yahoo`);
      console.error('');
      console.error('   After authentication, restart the server to enable MCP mode.');
      console.error('');
    }
  } catch (error: any) {
    console.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Shutting down Yahoo Fantasy MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Shutting down Yahoo Fantasy MCP Server...');
  process.exit(0);
});

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
