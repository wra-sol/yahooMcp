import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { FantasyTools } from '../tools/fantasy-tools.js';
import { OAuthCredentials } from '../types/index.js';
import { YahooFantasyMcpUIServer } from './mcp-ui-server.js';

export class YahooFantasyMcpServer {
  private server: McpServer;
  private fantasyTools: FantasyTools;
  private mcpUIServer: YahooFantasyMcpUIServer;
  private credentials: OAuthCredentials;
  private tokenSaveCallback?: (credentials: OAuthCredentials) => Promise<void>;
  private transport?: StdioServerTransport;

  constructor(credentials: OAuthCredentials, tokenSaveCallback?: (credentials: OAuthCredentials) => Promise<void>) {
    this.credentials = credentials;
    this.tokenSaveCallback = tokenSaveCallback;
    this.fantasyTools = new FantasyTools(credentials, tokenSaveCallback);
    this.mcpUIServer = new YahooFantasyMcpUIServer(credentials, tokenSaveCallback);
    
    this.server = new McpServer(
      {
        name: 'yahoo-fantasy-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const fantasyTools = this.fantasyTools.getTools();
      const uiTools = [
        {
          name: 'get_ui_resources',
          description: 'Get available UI resources for fantasy sports tools',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      ];
      
      return {
        tools: [...fantasyTools, ...uiTools],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        
        // Handle UI resources tool
        if (name === 'get_ui_resources') {
          try {
            const uiResources = this.mcpUIServer.createFantasyUIResources();
            console.error('[MCP] UI Resources count:', uiResources.length);
            
            // Return as text content with JSON representation
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    resources: uiResources,
                    count: uiResources.length,
                    message: 'UI resources available. Use individual UI tools to get specific components.'
                  }, null, 2)
                }
              ]
            };
          } catch (error) {
            console.error('[MCP] Error creating UI resources:', error);
            throw error;
          }
        }
        
        // Validate tool name exists
        const availableTools = this.fantasyTools.getTools();
        const toolExists = availableTools.some(tool => tool.name === name);
        
        if (!toolExists) {
          throw new Error(`Tool '${name}' not found`);
        }

        // Execute the tool
        const result = await this.fantasyTools.executeTool(name, args);
        
        // Safely get result size
        const resultJson = JSON.stringify(result) || 'null';
        console.error(`[MCP] Tool '${name}' completed, result size: ${resultJson.length} bytes`);

        if (result.type === 'resource') {
          return {
            content: [
              {
                type: 'resource',
                resource: result.resource,
              },
            ],
          };
        }
        
        const response = {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2) || 'null',
            },
          ],
        };
        
        console.error(`[MCP] Returning response for tool '${name}'`);
        return response;
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Update OAuth credentials
   */
  updateCredentials(credentials: Partial<OAuthCredentials>): void {
    this.credentials = { ...this.credentials, ...credentials };
    this.fantasyTools.updateCredentials(credentials);
    this.mcpUIServer.updateCredentials(credentials);
  }

  /**
   * Start the MCP server with stdio transport
   */
  async start(): Promise<void> {
    this.transport = new StdioServerTransport();
    await this.server.connect(this.transport);
    console.error('Yahoo Fantasy MCP Server started (stdio)');
  }

  /**
   * Get server instance (for HTTP integration)
   */
  getServer(): McpServer {
    return this.server;
  }

  /**
   * Get transport instance
   */
  getTransport(): StdioServerTransport | undefined {
    return this.transport;
  }

  /**
   * Get MCP-UI server instance
   */
  getMcpUIServer(): YahooFantasyMcpUIServer {
    return this.mcpUIServer;
  }

  /**
   * Get UI resources
   */
  getUIResources() {
    return this.mcpUIServer.createFantasyUIResources();
  }

}
