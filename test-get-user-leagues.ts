import { YahooFantasyClient } from './src/api/yahoo-fantasy-client.js';
import { OAuthCredentials } from './src/types/index.js';
import { readFile } from 'fs/promises';

async function test() {
  try {
    // Load tokens
    const tokensData = await readFile('.oauth-tokens.json', 'utf-8');
    const tokens = JSON.parse(tokensData);
    
    const credentials: OAuthCredentials = {
      consumerKey: process.env.YAHOO_CONSUMER_KEY!,
      consumerSecret: process.env.YAHOO_CONSUMER_SECRET!,
      accessToken: tokens.accessToken,
      accessTokenSecret: tokens.accessTokenSecret,
      sessionHandle: tokens.sessionHandle,
      tokenExpiresAt: tokens.tokenExpiresAt,
      tokenRefreshedAt: tokens.tokenRefreshedAt,
    };
    
    const client = new YahooFantasyClient(credentials);
    
    console.log('Testing getUserLeagues with gameKey "nfl"...');
    const result = await client.getUserLeagues('nfl');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
