import express, { Request, Response } from 'express';
import { YahooOAuthClient } from '../oauth/oauth-client.js';
import { OAuthCredentials } from '../types/index.js';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export class HttpOAuthServer {
  private app: express.Application;
  private oauthClient: YahooOAuthClient;
  private credentials: OAuthCredentials;
  private requestTokenStore: Map<string, { token: string; secret: string }> = new Map();
  private port: number;
  private tokenFilePath: string;

  constructor(credentials: OAuthCredentials, port: number = 3000) {
    this.credentials = credentials;
    this.oauthClient = new YahooOAuthClient(credentials);
    this.port = port;
    this.app = express();
    this.tokenFilePath = path.join(process.cwd(), '.oauth-tokens.json');
    
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Home page with auth instructions
    this.app.get('/', (req: Request, res: Response) => {
      const hasTokens = !!(this.credentials.accessToken && this.credentials.accessTokenSecret);
      
      res.send(`
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
      `);
    });

    // Start OAuth flow
    this.app.get('/oauth/start', async (req: Request, res: Response) => {
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
        res.redirect(authUrl);
      } catch (error: any) {
        res.status(500).send(`
          <h1>OAuth Error</h1>
          <p>Failed to start OAuth flow: ${error.message}</p>
          <a href="/">Go back</a>
        `);
      }
    });

    // OAuth callback
    this.app.get('/oauth/callback', async (req: Request, res: Response) => {
      try {
        const { oauth_token, oauth_verifier } = req.query;
        
        if (!oauth_token || !oauth_verifier) {
          throw new Error('Missing OAuth parameters');
        }
        
        // Retrieve stored request token
        const storedToken = this.requestTokenStore.get(oauth_token as string);
        if (!storedToken) {
          throw new Error('Invalid or expired request token');
        }
        
        // Exchange for access token
        const accessToken = await this.oauthClient.getAccessToken(
          storedToken.token,
          storedToken.secret,
          oauth_verifier as string
        );
        
        // Update credentials
        this.credentials.accessToken = accessToken.oauth_token;
        this.credentials.accessTokenSecret = accessToken.oauth_token_secret;
        this.credentials.sessionHandle = accessToken.oauth_session_handle;
        
        // Save tokens to file
        await this.saveTokens({
          accessToken: accessToken.oauth_token,
          accessTokenSecret: accessToken.oauth_token_secret,
          sessionHandle: accessToken.oauth_session_handle,
        });
        
        // Clean up request token
        this.requestTokenStore.delete(oauth_token as string);
        
        // Success page
        res.send(`
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
        `);
      } catch (error: any) {
        res.status(500).send(`
          <h1>OAuth Callback Error</h1>
          <p>${error.message}</p>
          <a href="/">Go back</a>
        `);
      }
    });

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        authenticated: !!(this.credentials.accessToken && this.credentials.accessTokenSecret),
        timestamp: new Date().toISOString(),
      });
    });
  }

  private async saveTokens(tokens: {
    accessToken: string;
    accessTokenSecret: string;
    sessionHandle?: string;
  }): Promise<void> {
    try {
      await writeFile(
        this.tokenFilePath,
        JSON.stringify(tokens, null, 2),
        'utf-8'
      );
      console.error(`✅ Tokens saved to ${this.tokenFilePath}`);
    } catch (error: any) {
      console.error(`Failed to save tokens: ${error.message}`);
    }
  }

  async loadTokens(): Promise<void> {
    try {
      if (existsSync(this.tokenFilePath)) {
        const data = await readFile(this.tokenFilePath, 'utf-8');
        const tokens = JSON.parse(data);
        
        this.credentials.accessToken = tokens.accessToken;
        this.credentials.accessTokenSecret = tokens.accessTokenSecret;
        this.credentials.sessionHandle = tokens.sessionHandle;
        
        console.error(`✅ Loaded tokens from ${this.tokenFilePath}`);
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
    
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.error(`✅ HTTP OAuth server running on http://localhost:${this.port}`);
        console.error(`   Visit http://localhost:${this.port} to authenticate`);
        resolve();
      });
    });
  }
}

