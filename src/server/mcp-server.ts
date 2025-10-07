import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { FantasyTools } from '../tools/fantasy-tools.js';
import { OAuthCredentials } from '../types/index.js';

export class YahooFantasyMcpServer {
  private server: Server;
  private fantasyTools: FantasyTools;
  private credentials: OAuthCredentials;
  private tokenSaveCallback?: (credentials: OAuthCredentials) => Promise<void>;

  constructor(credentials: OAuthCredentials, tokenSaveCallback?: (credentials: OAuthCredentials) => Promise<void>) {
    this.credentials = credentials;
    this.tokenSaveCallback = tokenSaveCallback;
    this.fantasyTools = new FantasyTools(credentials, tokenSaveCallback);
    
    this.server = new Server(
      {
        name: 'yahoo-fantasy-mcp',
        version: '1.0.0',
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
      return {
        tools: this.fantasyTools.getTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        
        // Validate tool name exists
        const availableTools = this.fantasyTools.getTools();
        const toolExists = availableTools.some(tool => tool.name === name);
        
        if (!toolExists) {
          throw new Error(`Tool '${name}' not found`);
        }

        // Execute the tool
        const result = await this.fantasyTools.executeTool(name, args);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
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
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Yahoo Fantasy MCP Server started');
  }

  /**
   * Get server instance (for testing)
   */
  getServer(): Server {
    return this.server;
  }
}
