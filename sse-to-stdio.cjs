#!/usr/bin/env node

const { spawn } = require('child_process');

// Start curl to connect to the SSE endpoint
const curl = spawn('curl', [
  '-N',
  '-H', 'Accept: text/event-stream',
  '-H', 'Cache-Control: no-cache',
  'http://localhost:3000/mcp'
], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Forward stdin to curl
process.stdin.pipe(curl.stdin);

// Forward curl output to stdout
curl.stdout.pipe(process.stdout);
curl.stderr.pipe(process.stderr);

// Handle process termination
process.on('SIGINT', () => {
  curl.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  curl.kill('SIGTERM');
  process.exit(0);
});

curl.on('error', (error) => {
  console.error('Curl error:', error);
  process.exit(1);
});

curl.on('exit', (code) => {
  process.exit(code);
});
