import crypto from 'crypto';
import {
  OAuthCredentials,
  OAuthTokenResponse,
  OAuthAccessTokenResponse,
} from '../types/index.js';

export class YahooOAuthClient {
  private credentials: OAuthCredentials;
  private authBaseUrl = 'https://api.login.yahoo.com/oauth2';

  constructor(credentials: OAuthCredentials) {
    this.credentials = credentials;
  }

  /**
   * Get authorization URL for OAuth 2.0 flow
   * This replaces the old getRequestToken + getAuthorizationUrl pattern
   */
  getAuthorizationUrl(callbackUrl?: string): string {
    const redirectUri = callbackUrl || process.env.OAUTH_CALLBACK_URL || 'http://localhost:3000/oauth/callback';
    
    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    
    const params = new URLSearchParams({
      client_id: this.credentials.consumerKey,
      redirect_uri: redirectUri,
      response_type: 'code',
      state: state,
    });
    
    // Store state for verification (in production, use session storage)
    this.credentials.state = state;
    
    return `${this.authBaseUrl}/request_auth?${params.toString()}`;
  }

  /**
   * Legacy method for compatibility - OAuth 2.0 doesn't use request tokens
   * Returns a dummy response with the state as the "token"
   */
  async getRequestToken(callbackUrl?: string): Promise<OAuthTokenResponse> {
    const state = crypto.randomBytes(16).toString('hex');
    this.credentials.state = state;
    
    return {
      oauth_token: state, // Use state as token for compatibility
      oauth_token_secret: '', // Not used in OAuth 2.0
      oauth_callback_confirmed: 'true',
    };
  }

  /**
   * Exchange authorization code for access token (OAuth 2.0)
   */
  async getAccessToken(
    code: string,
    redirectUri?: string,
    state?: string
  ): Promise<OAuthAccessTokenResponse> {
    const callbackUrl = redirectUri || process.env.OAUTH_CALLBACK_URL || 'http://localhost:3000/oauth/callback';
    
    const tokenUrl = `${this.authBaseUrl}/get_token`;
    
    const body = new URLSearchParams({
      client_id: this.credentials.consumerKey,
      client_secret: this.credentials.consumerSecret,
      redirect_uri: callbackUrl,
      code: code,
      grant_type: 'authorization_code',
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token Exchange Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        oauth_token: data.access_token || '',
        oauth_token_secret: '', // Not used in OAuth 2.0
        oauth_session_handle: data.refresh_token,
        oauth_authorization_expires_in: data.expires_in?.toString(),
        oauth_expires_in: data.expires_in?.toString(),
        xoauth_yahoo_guid: data.xoauth_yahoo_guid,
      } as OAuthAccessTokenResponse;
    } catch (error) {
      throw new Error(`Failed to get access token: ${error}`);
    }
  }

  /**
   * Refresh access token using refresh token (OAuth 2.0)
   */
  async refreshAccessToken(
    refreshToken: string
  ): Promise<OAuthAccessTokenResponse> {
    const tokenUrl = `${this.authBaseUrl}/get_token`;
    
    const body = new URLSearchParams({
      client_id: this.credentials.consumerKey,
      client_secret: this.credentials.consumerSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token Refresh Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        oauth_token: data.access_token || '',
        oauth_token_secret: '', // Not used in OAuth 2.0
        oauth_session_handle: data.refresh_token || refreshToken, // Keep old refresh token if not provided
        oauth_authorization_expires_in: data.expires_in?.toString(),
        oauth_expires_in: data.expires_in?.toString(),
        xoauth_yahoo_guid: data.xoauth_yahoo_guid,
      } as OAuthAccessTokenResponse;
    } catch (error) {
      throw new Error(`Failed to refresh access token: ${error}`);
    }
  }

  /**
   * Create authorization header for API requests (OAuth 2.0 Bearer token)
   */
  createAuthHeader(
    method: string,
    url: string,
    data?: any
  ): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.accessToken || ''}`,
    };
  }

  /**
   * Update stored credentials
   */
  updateCredentials(credentials: Partial<OAuthCredentials>): void {
    this.credentials = { ...this.credentials, ...credentials };
  }

  /**
   * Get current credentials
   */
  getCredentials(): OAuthCredentials {
    return { ...this.credentials };
  }

  /**
   * Check if we have valid access token (OAuth 2.0 only needs accessToken)
   */
  hasValidAccessToken(): boolean {
    return !!this.credentials.accessToken;
  }
}
