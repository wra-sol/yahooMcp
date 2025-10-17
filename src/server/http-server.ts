import { YahooOAuthClient } from '../oauth/oauth-client.js';
import { OAuthCredentials } from '../types/index.js';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { YahooFantasyMcpServer } from './mcp-server.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { IncomingMessage, ServerResponse } from 'http';

export class HttpOAuthServer {
  private server?: ReturnType<typeof Bun.serve>;
  private oauthClient: YahooOAuthClient;
  private credentials: OAuthCredentials;
  private requestTokenStore: Map<string, { token: string; secret: string }> = new Map();
  private port: number;
  private tokenFilePath: string;
  private mcpServer?: YahooFantasyMcpServer;
  private sseTransports: Map<string, SSEServerTransport> = new Map(); // Official MCP SDK transports

  constructor(credentials: OAuthCredentials, port: number = 3000) {
    this.credentials = credentials;
    this.oauthClient = new YahooOAuthClient(credentials);
    this.port = port;
    this.tokenFilePath = path.join(process.cwd(), '.oauth-tokens.json');
  }

  /**
   * Set the MCP server instance for SSE endpoint
   */
  setMcpServer(mcpServer: YahooFantasyMcpServer): void {
    this.mcpServer = mcpServer;
  }

  private async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

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

    // Route: MCP-UI Demo page
    if (pathname === '/mcp-ui-demo' && req.method === 'GET') {
      return this.handleMcpUIDemo();
    }

    // Route: MCP SSE endpoint (official MCP SDK transport)
    if (pathname === '/mcp' && req.method === 'GET') {
      return this.handleMcpSseEndpoint(req);
    }

    // Route: MCP message endpoint (official MCP SDK transport)
    if (pathname === '/mcp/messages' && req.method === 'POST') {
      return this.handleMcpMessage(req);
    }

    // Route: MCP-UI resources endpoint
    if (pathname === '/mcp-ui/resources' && req.method === 'GET') {
      return this.handleMcpUIResources();
    }

    // Route: MCP-UI component endpoint
    if (pathname.startsWith('/mcp-ui/component/') && req.method === 'GET') {
      const componentId = pathname.split('/').pop();
      return this.handleMcpUIComponent(componentId);
    }

    // Route: MCP-UI action endpoint
    if (pathname === '/mcp-ui/action' && req.method === 'POST') {
      return this.handleMcpUIAction(req);
    }

    // 404 Not Found
    return new Response('Not Found', { status: 404 });
  }

  private handleHomePage(): Response {
    const hasTokens = !!this.credentials.accessToken;
    
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
            
            ${hasTokens ? `
              <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #0066cc;">🎨 Try the Interactive UI Demo!</h3>
                <p>Experience the power of MCP-UI with our interactive fantasy sports components:</p>
                <a href="/mcp-ui-demo" class="button" style="background: #0066cc; color: white; text-decoration: none; display: inline-block; padding: 12px 24px; border-radius: 6px; font-weight: 500;">
                  🚀 Launch MCP-UI Demo
                </a>
                <p style="margin-bottom: 0; font-size: 14px; color: #666;">
                  Interactive forms, real-time data, and dynamic UI components powered by MCP-UI
                </p>
              </div>
            ` : ''}
            
            <h2>API Endpoints</h2>
            <ul>
              <li><code>GET /</code> - This page</li>
              <li><code>GET /oauth/start</code> - Start OAuth flow</li>
              <li><code>GET /oauth/callback</code> - OAuth callback (automatic)</li>
              <li><code>GET /health</code> - Health check</li>
              <li><strong>MCP Protocol (Official SDK Transport):</strong>
                <ul>
                  <li><code>GET /mcp</code> - SSE transport endpoint</li>
                  <li><code>POST /mcp/messages?sessionId=...</code> - Message endpoint</li>
                </ul>
              </li>
              <li><strong>MCP-UI (Interactive Components):</strong>
                <ul>
                  <li><code>GET /mcp-ui-demo</code> - Interactive UI demo</li>
                  <li><code>GET /mcp-ui/resources</code> - UI resources</li>
                  <li><code>GET /mcp-ui/component/{id}</code> - Specific component</li>
                  <li><code>POST /mcp-ui/action</code> - Execute UI actions</li>
                </ul>
              </li>
            </ul>
            
            <h2>MCP Protocol Usage</h2>
            
            <p>This server implements the official Model Context Protocol using Server-Sent Events (SSE) transport:</p>
            
            <h3>Connection Flow</h3>
            <ol>
              <li>Establish SSE connection: <code>GET ${process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : `http://localhost:${this.port}`}/mcp</code></li>
              <li>Receive session ID from response headers or SSE endpoint event</li>
              <li>Send JSON-RPC messages: <code>POST /mcp/messages?sessionId=YOUR_SESSION_ID</code></li>
              <li>Receive responses via SSE stream</li>
            </ol>
            
            <h3>Example</h3>
            <pre><code>// 1. Connect to SSE endpoint
const eventSource = new EventSource('${process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : `http://localhost:${this.port}`}/mcp');

// 2. Listen for session ID
eventSource.addEventListener('endpoint', (e) => {
  const sessionId = e.data; // Get session ID
});

// 3. Send messages
fetch('/mcp/messages?sessionId=abc-123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  })
});

// 4. Receive responses via SSE
eventSource.addEventListener('message', (e) => {
  const response = JSON.parse(e.data);
  console.log(response);
});</code></pre>
            
            <p>✅ Fully compliant with MCP protocol specification (v2024-11-05)</p>
            
            <h2>MCP Client Integration</h2>
            <p>To use this server with MCP-compatible clients (n8n, Claude Desktop, etc.):</p>
            <ol>
              <li>Add an MCP Client connection in your application</li>
              <li>Set connection type to <strong>Server-Sent Events (SSE)</strong></li>
              <li>Set server URL to: <code>${process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : `http://localhost:${this.port}`}/mcp</code></li>
              <li>The client will automatically handle session management and JSON-RPC messaging</li>
            </ol>
            
            <h3>Available Tools</h3>
            <p>Once connected, you can use 40+ Yahoo Fantasy Sports tools including:</p>
            <ul>
              <li>League information and standings</li>
              <li>Team rosters and matchups</li>
              <li>Player stats and availability</li>
              <li>Transaction management (add/drop/trade)</li>
              <li>Free agent searches</li>
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
      
      // Get authorization URL (OAuth 2.0 - no request token needed)
      const authUrl = this.oauthClient.getAuthorizationUrl(callbackUrl);
      
      // Store state for CSRF verification
      const state = this.credentials.state;
      if (state) {
        this.requestTokenStore.set(state, {
          token: state,
          secret: '',
        });
      }
      
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
      // OAuth 2.0 callback parameters
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      
      // Check for OAuth error
      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }
      
      if (!code || !state) {
        throw new Error('Missing OAuth parameters (code or state)');
      }
      
      // Verify state parameter for CSRF protection
      const storedState = this.requestTokenStore.get(state);
      if (!storedState) {
        throw new Error('Invalid or expired state parameter');
      }
      
      // Determine callback URL
      const callbackUrl = process.env.OAUTH_CALLBACK_URL || 
                         `http://localhost:${this.port}/oauth/callback`;
      
      // Exchange authorization code for access token
      const accessToken = await this.oauthClient.getAccessToken(code, callbackUrl, state);
      
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
      
      // Update MCP server credentials if it exists
      if (this.mcpServer) {
        this.mcpServer.updateCredentials({
          accessToken: accessToken.oauth_token,
          accessTokenSecret: accessToken.oauth_token_secret,
          sessionHandle: accessToken.oauth_session_handle,
          tokenExpiresAt,
          tokenRefreshedAt: now,
        });
      }
      
      // Clean up state
      this.requestTokenStore.delete(state);
      
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
      authenticated: !!this.credentials.accessToken,
      timestamp: new Date().toISOString(),
      server: 'Bun native HTTP',
      mcpEnabled: !!this.mcpServer,
      mcpProtocol: '2024-11-05',
      endpoints: {
        sse: '/mcp',
        messages: '/mcp/messages',
      },
      transport: 'Official MCP SDK (SSEServerTransport)',
    };

    return new Response(JSON.stringify(data, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Handle MCP SSE endpoint
   * Uses the official SSEServerTransport from @modelcontextprotocol/sdk
   */
  private async handleMcpSseEndpoint(req: Request): Promise<Response> {
    if (!this.mcpServer) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'MCP server not initialized. Please authenticate first.',
        },
      }), {
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    console.error('[MCP SSE] New connection established');

    // Create a mock ServerResponse that works with SSEServerTransport
    const stream = new ReadableStream({
      start: async (controller) => {
        try {
          // Create a mock ServerResponse object for SSEServerTransport
          let isHeadersSent = false;
          let isFinished = false;
          
          const mockResponse: any = {
            get headersSent() { return isHeadersSent; },
            get finished() { return isFinished; },
            writeHead: (statusCode: number, headers: any) => {
              isHeadersSent = true;
              console.error(`[MCP SSE] writeHead called: ${statusCode}`);
              // Headers are already set on the Response object
              return mockResponse;
            },
            write: (chunk: any, encoding?: any, callback?: any) => {
              try {
                const data = typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk;
                const chunkStr = typeof chunk === 'string' ? chunk : new TextDecoder().decode(data);
                console.error(`[MCP SSE] Writing chunk (${data.length} bytes): ${chunkStr.substring(0, 100)}...`);
                controller.enqueue(data);
                if (typeof encoding === 'function') {
                  encoding(); // encoding is actually the callback
                } else if (callback) {
                  callback();
                }
                return true;
              } catch (e) {
                console.error('[MCP SSE] Error writing chunk:', e);
                return false;
              }
            },
            end: (chunk?: any, encoding?: any, callback?: any) => {
              isFinished = true;
              try {
                if (chunk) {
                  const data = typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk;
                  controller.enqueue(data);
                }
                controller.close();
                if (typeof chunk === 'function') {
                  chunk(); // chunk is actually the callback
                } else if (typeof encoding === 'function') {
                  encoding();
                } else if (callback) {
                  callback();
                }
              } catch (e) {
                // Already closed
              }
              return mockResponse;
            },
            setHeader: () => mockResponse,
            getHeader: () => undefined,
            removeHeader: () => mockResponse,
            on: () => mockResponse,
            once: () => mockResponse,
            emit: () => true,
            // Add other required ServerResponse properties
          } as unknown as ServerResponse;

          // Create official SSE transport with mock response
          const transport = new SSEServerTransport('/mcp/messages', mockResponse);

          // Store transport with session ID from transport
          const sessionId = transport.sessionId;
          this.sseTransports.set(sessionId, transport);
          console.error(`[MCP SSE] Session created: ${sessionId}`);

          // Send keepalive heartbeats every 3 seconds to prevent timeout
          const keepaliveInterval = setInterval(() => {
            try {
              // Send SSE comment (keepalive)
              const keepalive = ': keepalive\n\n';
              controller.enqueue(new TextEncoder().encode(keepalive));
            } catch (e) {
              clearInterval(keepaliveInterval);
            }
          }, 3000);

          // Connect MCP server to transport
          await this.mcpServer!.getServer().connect(transport);

          // Handle connection close
          req.signal.addEventListener('abort', () => {
            console.error(`[MCP SSE] Connection closed: ${sessionId}`);
            clearInterval(keepaliveInterval);
            this.sseTransports.delete(sessionId);
            transport.close();
          });
        } catch (error: any) {
          console.error('[MCP SSE] Error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  /**
   * Handle MCP message endpoint
   * Processes JSON-RPC messages using the official SSEServerTransport
   */
  private async handleMcpMessage(req: Request): Promise<Response> {
    if (!this.mcpServer) {
      return new Response(JSON.stringify({ 
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'MCP server not initialized'
        }
      }), {
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    try {
      // Get session ID from query parameters
      const url = new URL(req.url);
      const sessionId = url.searchParams.get('sessionId');

      if (!sessionId) {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Missing sessionId parameter'
          }
        }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Get the transport for this session
      const transport = this.sseTransports.get(sessionId);
      if (!transport) {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid or expired sessionId'
          }
        }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Parse the message
      const message = await req.json();
      console.error(`[MCP:${sessionId.slice(0, 8)}] Received: ${message.method}`);

      // Create mock IncomingMessage object
      const mockReq = {
        headers: Object.fromEntries(req.headers.entries()),
        url: url.pathname + url.search,
        method: req.method,
      } as any as IncomingMessage;

      // Create mock ServerResponse object
      const mockRes = {
        headersSent: false,
        finished: false,
        writeHead: () => mockRes,
        write: () => true,
        end: () => mockRes,
        setHeader: () => mockRes,
        getHeader: () => undefined,
        removeHeader: () => mockRes,
      } as any as ServerResponse;

      // Process the message through the official transport
      await transport.handlePostMessage(mockReq, mockRes, message);

      // Return 202 Accepted (standard for SSE message handling)
      return new Response(null, {
        status: 202,
        headers: { 
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error: any) {
      console.error('[MCP] Message error:', error);
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error.message || 'Internal server error'
        }
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }

  private async saveTokens(tokens: {
    accessToken: string;
    accessTokenSecret?: string;
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
      if (credentials.accessToken) {
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
        
        // Update MCP server credentials if it exists
        if (this.mcpServer) {
          this.mcpServer.updateCredentials({
            accessToken: credentials.accessToken,
            accessTokenSecret: credentials.accessTokenSecret,
            sessionHandle: credentials.sessionHandle,
            tokenExpiresAt: credentials.tokenExpiresAt,
            tokenRefreshedAt: credentials.tokenRefreshedAt,
          });
        }
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

  /**
   * Handle MCP-UI resources endpoint
   */
  private handleMcpUIResources(): Response {
    if (!this.mcpServer) {
      return new Response('MCP Server not available', { status: 503 });
    }

    try {
      const uiResources = this.mcpServer.getUIResources();
      return new Response(JSON.stringify(uiResources), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error: any) {
      return new Response(`Error getting UI resources: ${error.message}`, { status: 500 });
    }
  }

  /**
   * Handle MCP-UI component endpoint
   */
  private handleMcpUIComponent(componentId?: string): Response {
    if (!this.mcpServer) {
      return new Response('MCP Server not available', { status: 503 });
    }

    if (!componentId) {
      return new Response('Component ID required', { status: 400 });
    }

    try {
      const uiResources = this.mcpServer.getUIResources();
      const component = uiResources.find((resource: any) => resource.id === componentId);
      
      if (!component) {
        return new Response('Component not found', { status: 404 });
      }

      return new Response(JSON.stringify(component), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error: any) {
      return new Response(`Error getting component: ${error.message}`, { status: 500 });
    }
  }

  /**
   * Handle MCP-UI action endpoint
   */
  private async handleMcpUIAction(req: Request): Promise<Response> {
    if (!this.mcpServer) {
      return new Response('MCP Server not available', { status: 503 });
    }

    try {
      const body = await req.json();
      const { action, parameters } = body;

      if (!action) {
        return new Response('Action required', { status: 400 });
      }

      // Execute the action using the fantasy tools
      const fantasyTools = this.mcpServer.getMcpUIServer().getFantasyTools();
      const result = await fantasyTools.executeTool(action, parameters || {});

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error: any) {
      return new Response(`Error executing action: ${error.message}`, { status: 500 });
    }
  }

  /**
   * Handle MCP-UI demo page
   */
  private handleMcpUIDemo(): Response {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const demoPath = path.join(__dirname, '../client/mcp-ui-demo.html');
      const html = fs.readFileSync(demoPath, 'utf8');
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    } catch (error: any) {
      return new Response(`Error loading demo page: ${error.message}`, { status: 500 });
    }
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

