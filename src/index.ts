#!/usr/bin/env node

import { YahooFantasyMcpServer } from './server/mcp-server.js';
import { YahooOAuthClient } from './oauth/oauth-client.js';
import { OAuthCredentials } from './types/index.js';

/**
 * Yahoo Fantasy MCP Server
 * 
 * This server provides Model Context Protocol (MCP) tools for interacting
 * with the Yahoo Fantasy Sports API.
 * 
 * Setup:
 * 1. Register your application at https://developer.yahoo.com/
 * 2. Get your Consumer Key and Consumer Secret
 * 3. Set environment variables or provide credentials directly
 * 4. Run OAuth flow to get access tokens
 * 5. Start the MCP server
 */

async function main() {
  // Get credentials from environment variables or use defaults for testing
  const credentials: OAuthCredentials = {
    consumerKey: process.env.YAHOO_CONSUMER_KEY || '',
    consumerSecret: process.env.YAHOO_CONSUMER_SECRET || '',
    accessToken: process.env.YAHOO_ACCESS_TOKEN || '',
    accessTokenSecret: process.env.YAHOO_ACCESS_TOKEN_SECRET || '',
    sessionHandle: process.env.YAHOO_SESSION_HANDLE || '',
  };

  // Validate required credentials
  if (!credentials.consumerKey || !credentials.consumerSecret) {
    console.error('Error: YAHOO_CONSUMER_KEY and YAHOO_CONSUMER_SECRET environment variables are required');
    console.error('');
    console.error('To get these credentials:');
    console.error('1. Go to https://developer.yahoo.com/');
    console.error('2. Create a new application');
    console.error('3. Select "Fantasy Sports" with Read/Write permissions');
    console.error('4. Copy your Consumer Key and Consumer Secret');
    console.error('5. Set environment variables:');
    console.error('   export YAHOO_CONSUMER_KEY="your_consumer_key"');
    console.error('   export YAHOO_CONSUMER_SECRET="your_consumer_secret"');
    process.exit(1);
  }

  // If no access token, guide user through OAuth flow
  if (!credentials.accessToken || !credentials.accessTokenSecret) {
    console.error('No access token found. Starting OAuth flow...');
    
    try {
      const oauthClient = new YahooOAuthClient(credentials);
      
      // Step 1: Get request token
      console.error('Getting request token...');
      const requestToken = await oauthClient.getRequestToken();
      
      // Step 2: Get authorization URL
      const authUrl = oauthClient.getAuthorizationUrl(requestToken.oauth_token);
      
      console.error('');
      console.error('Please visit the following URL to authorize the application:');
      console.error('');
      console.error(authUrl);
      console.error('');
      console.error('After authorization, you will receive a verification code.');
      console.error('Enter the verification code:');
      
      // For demo purposes, we'll exit here since we can't interactively get the verifier
      // In a real application, you'd read from stdin or implement a web flow
      console.error('');
      console.error('Note: This is a demo. In a real application, you would:');
      console.error('1. Open the URL in a browser');
      console.error('2. Authorize the application');
      console.error('3. Copy the verification code');
      console.error('4. Continue the OAuth flow');
      console.error('');
      console.error('For now, please set the access tokens manually:');
      console.error('export YAHOO_ACCESS_TOKEN="your_access_token"');
      console.error('export YAHOO_ACCESS_TOKEN_SECRET="your_access_token_secret"');
      console.error('export YAHOO_SESSION_HANDLE="your_session_handle"');
      process.exit(1);
      
    } catch (error: any) {
      console.error(`OAuth setup failed: ${error.message}`);
      process.exit(1);
    }
  }

  // Create and start the MCP server
  try {
    const mcpServer = new YahooFantasyMcpServer(credentials);
    await mcpServer.start();
  } catch (error: any) {
    console.error(`Failed to start MCP server: ${error.message}`);
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
