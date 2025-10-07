import { YahooOAuthClient } from '../oauth/oauth-client.js';
import { OAuthCredentials } from '../types/index.js';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export class HttpOAuthServer {
  private server?: ReturnType<typeof Bun.serve>;
  private oauthClient: YahooOAuthClient;
  private credentials: OAuthCredentials;
  private requestTokenStore: Map<string, { token: string; secret: string }> = new Map();
  private port: number;
  private tokenFilePath: string;

  constructor(credentials: OAuthCredentials, port: number = 3000) {
    this.credentials = credentials;
    this.oauthClient = new YahooOAuthClient(credentials);
    this.port = port;
    this.tokenFilePath = path.join(process.cwd(), '.oauth-tokens.json');
  }

  private async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Route: Home page
    if (pathname === '/' && req.method === 'GET') {
      return this.handleHomePage();
    }

    // Route: Start OAuth flow
    if (pathname === '/oauth/start' && req.method === 'GET') {
      return this.handleOAuthStart();
    }

    // Route: OAuth callback
    if (pathname === '/oauth/callback' && req.method === 'GET') {
      return this.handleOAuthCallback(url);
    }

    // Route: Health check
    if (pathname === '/health' && req.method === 'GET') {
      return this.handleHealthCheck();
    }

    // 404 Not Found
    return new Response('Not Found', { status: 404 });
  }

  private handleHomePage(): Response {
    const hasTokens = !!(this.credentials.accessToken && this.credentials.accessTokenSecret);
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Yahoo Fantasy MCP - OAuth Setup</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .card {
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1 { color: #6001d2; margin-top: 0; }
            .status {
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .status.success {
              background: #d4edda;
              color: #155724;
              border: 1px solid #c3e6cb;
            }
            .status.warning {
              background: #fff3cd;
              color: #856404;
              border: 1px solid #ffeaa7;
            }
            .button {
              display: inline-block;
              background: #6001d2;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: 500;
              margin-top: 10px;
            }
            .button:hover {
              background: #4d01a8;
            }
            pre {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              overflow-x: auto;
            }
            code {
              color: #e83e8c;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🏈 Yahoo Fantasy MCP Server</h1>
            <p><em>Powered by Bun's high-performance HTTP server</em></p>
            
            ${hasTokens ? `
              <div class="status success">
                <strong>✅ Authenticated!</strong><br>
                Your OAuth tokens are configured and the MCP server is ready to use.
              </div>
              <p><strong>Access Token:</strong> ${this.credentials.accessToken?.substring(0, 20)}...</p>
              <p><strong>Session Handle:</strong> ${this.credentials.sessionHandle ? 'Present' : 'Not available'}</p>
            ` : `
              <div class="status warning">
                <strong>⚠️ Not Authenticated</strong><br>
                Click the button below to authenticate with Yahoo Fantasy Sports.
              </div>
              <a href="/oauth/start" class="button">🔐 Authenticate with Yahoo</a>
            `}
            
            <h2>Setup Instructions</h2>
            <ol>
              <li>Make sure you've set up your Yahoo Developer App with redirect URI:
                <pre><code>${process.env.OAUTH_CALLBACK_URL || `http://localhost:${this.port}/oauth/callback`}</code></pre>
              </li>
              <li>Set your environment variables:
                <pre><code>YAHOO_CONSUMER_KEY=your_key
YAHOO_CONSUMER_SECRET=your_secret
OAUTH_CALLBACK_URL=${process.env.OAUTH_CALLBACK_URL || `http://localhost:${this.port}/oauth/callback`}</code></pre>
              </li>
              <li>Click the "Authenticate with Yahoo" button above</li>
              <li>Your tokens will be saved automatically</li>
            </ol>

            <h2>MCP Server Status</h2>
            <p>The MCP server is running and ready to accept tool calls via stdio.</p>
            
            <h2>API Endpoints</h2>
            <ul>
              <li><code>GET /</code> - This page</li>
              <li><code>GET /oauth/start</code> - Start OAuth flow</li>
              <li><code>GET /oauth/callback</code> - OAuth callback (automatic)</li>
              <li><code>GET /health</code> - Health check</li>
            </ul>
          </div>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  private async handleOAuthStart(): Promise<Response> {
    try {
      // Determine callback URL based on environment
      const callbackUrl = process.env.OAUTH_CALLBACK_URL || 
                         `http://localhost:${this.port}/oauth/callback`;
      
      // Get request token
      const requestToken = await this.oauthClient.getRequestToken(callbackUrl);
      
      // Store request token for callback
      this.requestTokenStore.set(requestToken.oauth_token, {
        token: requestToken.oauth_token,
        secret: requestToken.oauth_token_secret,
      });
      
      // Get authorization URL
      const authUrl = this.oauthClient.getAuthorizationUrl(requestToken.oauth_token);
      
      // Redirect to Yahoo authorization
      return Response.redirect(authUrl, 302);
    } catch (error: any) {
      const html = `
        <h1>OAuth Error</h1>
        <p>Failed to start OAuth flow: ${error.message}</p>
        <a href="/">Go back</a>
      `;
      return new Response(html, {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      });
    }
  }

  private async handleOAuthCallback(url: URL): Promise<Response> {
    try {
      const oauth_token = url.searchParams.get('oauth_token');
      const oauth_verifier = url.searchParams.get('oauth_verifier');
      
      if (!oauth_token || !oauth_verifier) {
        throw new Error('Missing OAuth parameters');
      }
      
      // Retrieve stored request token
      const storedToken = this.requestTokenStore.get(oauth_token);
      if (!storedToken) {
        throw new Error('Invalid or expired request token');
      }
      
      // Exchange for access token
      const accessToken = await this.oauthClient.getAccessToken(
        storedToken.token,
        storedToken.secret,
        oauth_verifier
      );
      
      // Calculate token expiration
      const now = Date.now();
      const expiresIn = accessToken.oauth_expires_in ? parseInt(accessToken.oauth_expires_in) * 1000 : 3600 * 1000; // Default 1 hour
      const tokenExpiresAt = now + expiresIn;

      // Update credentials
      this.credentials.accessToken = accessToken.oauth_token;
      this.credentials.accessTokenSecret = accessToken.oauth_token_secret;
      this.credentials.sessionHandle = accessToken.oauth_session_handle;
      this.credentials.tokenExpiresAt = tokenExpiresAt;
      this.credentials.tokenRefreshedAt = now;
      
      // Save tokens to file
      await this.saveTokens({
        accessToken: accessToken.oauth_token,
        accessTokenSecret: accessToken.oauth_token_secret,
        sessionHandle: accessToken.oauth_session_handle,
        tokenExpiresAt,
        tokenRefreshedAt: now,
      });
      
      // Clean up request token
      this.requestTokenStore.delete(oauth_token);
      
      // Success page
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Successful</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: #f5f5f5;
              }
              .card {
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                text-align: center;
              }
              h1 { color: #28a745; }
              .checkmark {
                font-size: 72px;
                margin: 20px 0;
              }
              pre {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                text-align: left;
                overflow-x: auto;
              }
              .button {
                display: inline-block;
                background: #6001d2;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="checkmark">✅</div>
              <h1>Authentication Successful!</h1>
              <p>Your Yahoo Fantasy Sports OAuth tokens have been saved.</p>
              
              <h3>Tokens Saved:</h3>
              <pre>Access Token: ${accessToken.oauth_token.substring(0, 30)}...
Session Handle: ${accessToken.oauth_session_handle ? 'Present' : 'Not available'}</pre>
              
              <p><strong>Tokens have been saved to:</strong> <code>.oauth-tokens.json</code></p>
              
              <h3>Next Steps:</h3>
              <ol style="text-align: left;">
                <li>Add these to your Railway environment variables:
                  <pre>YAHOO_ACCESS_TOKEN=${accessToken.oauth_token}
YAHOO_ACCESS_TOKEN_SECRET=${accessToken.oauth_token_secret}
YAHOO_SESSION_HANDLE=${accessToken.oauth_session_handle || ''}</pre>
                </li>
                <li>Your MCP server is now ready to use!</li>
              </ol>
              
              <a href="/" class="button">Back to Home</a>
            </div>
          </body>
        </html>
      `;

      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    } catch (error: any) {
      const html = `
        <h1>OAuth Callback Error</h1>
        <p>${error.message}</p>
        <a href="/">Go back</a>
      `;
      return new Response(html, {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      });
    }
  }

  private handleHealthCheck(): Response {
    const data = {
      status: 'ok',
      authenticated: !!(this.credentials.accessToken && this.credentials.accessTokenSecret),
      timestamp: new Date().toISOString(),
      server: 'Bun native HTTP',
    };

    return new Response(JSON.stringify(data, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async saveTokens(tokens: {
    accessToken: string;
    accessTokenSecret: string;
    sessionHandle?: string;
    tokenExpiresAt?: number;
    tokenRefreshedAt?: number;
  }): Promise<void> {
    try {
      await writeFile(
        this.tokenFilePath,
        JSON.stringify(tokens, null, 2),
        'utf-8'
      );
      console.error(`✅ Tokens saved to ${this.tokenFilePath}`);
      if (tokens.tokenExpiresAt) {
        console.error(`   Token expires at: ${new Date(tokens.tokenExpiresAt).toISOString()}`);
      }
    } catch (error: any) {
      console.error(`Failed to save tokens: ${error.message}`);
    }
  }

  /**
   * Get token save callback function
   * This can be passed to the API client for automatic token persistence
   */
  getTokenSaveCallback(): (credentials: OAuthCredentials) => Promise<void> {
    return async (credentials: OAuthCredentials) => {
      if (credentials.accessToken && credentials.accessTokenSecret) {
        await this.saveTokens({
          accessToken: credentials.accessToken,
          accessTokenSecret: credentials.accessTokenSecret,
          sessionHandle: credentials.sessionHandle,
          tokenExpiresAt: credentials.tokenExpiresAt,
          tokenRefreshedAt: credentials.tokenRefreshedAt,
        });
        
        // Update internal credentials reference
        this.credentials.accessToken = credentials.accessToken;
        this.credentials.accessTokenSecret = credentials.accessTokenSecret;
        this.credentials.sessionHandle = credentials.sessionHandle;
        this.credentials.tokenExpiresAt = credentials.tokenExpiresAt;
        this.credentials.tokenRefreshedAt = credentials.tokenRefreshedAt;
      }
    };
  }

  async loadTokens(): Promise<void> {
    try {
      if (existsSync(this.tokenFilePath)) {
        const data = await readFile(this.tokenFilePath, 'utf-8');
        const tokens = JSON.parse(data);
        
        this.credentials.accessToken = tokens.accessToken;
        this.credentials.accessTokenSecret = tokens.accessTokenSecret;
        this.credentials.sessionHandle = tokens.sessionHandle;
        this.credentials.tokenExpiresAt = tokens.tokenExpiresAt;
        this.credentials.tokenRefreshedAt = tokens.tokenRefreshedAt;
        
        console.error(`✅ Loaded tokens from ${this.tokenFilePath}`);
        
        // Check if token is expired
        if (tokens.tokenExpiresAt) {
          const now = Date.now();
          if (now >= tokens.tokenExpiresAt) {
            console.error(`⚠️  Token expired at: ${new Date(tokens.tokenExpiresAt).toISOString()}`);
            console.error(`   Token will be refreshed on first API request`);
          } else {
            const timeUntilExpiry = tokens.tokenExpiresAt - now;
            const minutesUntilExpiry = Math.floor(timeUntilExpiry / (60 * 1000));
            console.error(`   Token expires in ${minutesUntilExpiry} minutes`);
          }
        }
      }
    } catch (error: any) {
      console.error(`Failed to load tokens: ${error.message}`);
    }
  }

  getCredentials(): OAuthCredentials {
    return this.credentials;
  }

  async start(): Promise<void> {
    // Try to load existing tokens
    await this.loadTokens();
    
    // Start Bun's native HTTP server
    this.server = Bun.serve({
      port: this.port,
      fetch: (req) => this.handleRequest(req),
      error: (error) => {
        console.error('Server error:', error);
        return new Response('Internal Server Error', { status: 500 });
      },
    });

    console.error(`✅ HTTP OAuth server running on http://localhost:${this.port}`);
    console.error(`   Visit http://localhost:${this.port} to authenticate`);
    console.error(`   Powered by Bun's high-performance native HTTP server`);
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.stop();
      console.error('✅ HTTP server stopped');
    }
  }
}

