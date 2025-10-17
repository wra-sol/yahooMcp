#!/usr/bin/env node

const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse.js');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');

async function main() {
  try {
    const transport = new SSEClientTransport(new URL('http://localhost:3000/mcp'));
    const client = new Client(
      { name: 'claude-desktop', version: '1.0.0' },
      { capabilities: {} }
    );

    await client.connect(transport);
    
    // Keep the connection alive and forward stdio
    process.stdin.pipe(process.stdout);
    
    // Handle process termination
    process.on('SIGINT', async () => {
      await client.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await client.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error connecting to MCP server:', error);
    process.exit(1);
  }
}

main();
