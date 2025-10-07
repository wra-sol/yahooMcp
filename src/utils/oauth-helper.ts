import { YahooOAuthClient } from '../oauth/oauth-client.js';
import { OAuthCredentials, OAuthAccessTokenResponse } from '../types/index.js';
import readline from 'readline';

/**
 * Helper class for interactive OAuth flow
 */
export class OAuthHelper {
  private oauthClient: YahooOAuthClient;

  constructor(credentials: OAuthCredentials) {
    this.oauthClient = new YahooOAuthClient(credentials);
  }

  /**
   * Complete OAuth flow interactively
   */
  async completeOAuthFlow(): Promise<OAuthAccessTokenResponse> {
    try {
      // Step 1: Get request token
      console.log('Getting request token...');
      const requestToken = await this.oauthClient.getRequestToken();
      
      // Step 2: Get authorization URL
      const authUrl = this.oauthClient.getAuthorizationUrl(requestToken.oauth_token);
      
      console.log('\nPlease visit the following URL to authorize the application:');
      console.log(authUrl);
      console.log('\nAfter authorization, you will receive a verification code.');
      
      // Step 3: Get verification code from user
      const verifier = await this.promptForVerificationCode();
      
      // Step 4: Exchange for access token
      console.log('Exchanging request token for access token...');
      const accessToken = await this.oauthClient.getAccessToken(
        requestToken.oauth_token,
        requestToken.oauth_token_secret,
        verifier
      );
      
      console.log('OAuth flow completed successfully!');
      return accessToken;
      
    } catch (error: any) {
      throw new Error(`OAuth flow failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token using session handle
   */
  async refreshAccessToken(
    accessToken: string,
    accessTokenSecret: string,
    sessionHandle: string
  ): Promise<OAuthAccessTokenResponse> {
    try {
      console.log('Refreshing access token...');
      return await this.oauthClient.refreshAccessToken(
        accessToken,
        accessTokenSecret,
        sessionHandle
      );
    } catch (error: any) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Prompt user for verification code
   */
  private async promptForVerificationCode(): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve, reject) => {
      rl.question('Enter the verification code: ', (answer) => {
        rl.close();
        if (answer.trim()) {
          resolve(answer.trim());
        } else {
          reject(new Error('Verification code cannot be empty'));
        }
      });
    });
  }

  /**
   * Generate environment variable commands
   */
  generateEnvCommands(accessToken: OAuthAccessTokenResponse): string[] {
    const commands = [
      `export YAHOO_ACCESS_TOKEN="${accessToken.oauth_token}"`,
      `export YAHOO_ACCESS_TOKEN_SECRET="${accessToken.oauth_token_secret}"`,
    ];

    if (accessToken.oauth_session_handle) {
      commands.push(`export YAHOO_SESSION_HANDLE="${accessToken.oauth_session_handle}"`);
    }

    return commands;
  }

  /**
   * Print environment setup instructions
   */
  printEnvSetup(accessToken: OAuthAccessTokenResponse): void {
    console.log('\nOAuth setup completed! Add these to your environment:');
    console.log('');
    
    const commands = this.generateEnvCommands(accessToken);
    commands.forEach(command => {
      console.log(command);
    });
    
    console.log('');
    console.log('Or add them to your .env file:');
    console.log('');
    commands.forEach(command => {
      const [key, value] = command.split('=');
      console.log(`${key.replace('export ', '')}=${value}`);
    });
  }
}
