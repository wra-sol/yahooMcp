import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import axios, { AxiosRequestConfig } from 'axios';
import {
  OAuthCredentials,
  OAuthTokenResponse,
  OAuthAccessTokenResponse,
} from '../types/index.js';

export class YahooOAuthClient {
  private oauth: OAuth;
  private credentials: OAuthCredentials;

  constructor(credentials: OAuthCredentials) {
    this.credentials = credentials;
    this.oauth = new OAuth({
      consumer: {
        key: credentials.consumerKey,
        secret: credentials.consumerSecret,
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string: string, key: string) {
        return crypto.createHmac('sha1', key).update(base_string).digest('base64');
      },
    });
  }

  /**
   * Get request token for OAuth flow
   */
  async getRequestToken(callbackUrl?: string): Promise<OAuthTokenResponse> {
    const requestData = {
      url: 'https://api.login.yahoo.com/oauth/v2/get_request_token',
      method: 'POST',
      data: {
        oauth_callback: callbackUrl || process.env.OAUTH_CALLBACK_URL || 'oob', // Support custom callback or fallback to oob
        oauth_consumer_key: this.credentials.consumerKey,
      },
    };

    const authHeader = this.oauth.toHeader(this.oauth.authorize(requestData));

    try {
      const response = await axios.post(requestData.url, requestData.data, {
        headers: {
          ...authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const parsed = this.parseOAuthResponse(response.data);
      return {
        oauth_token: parsed.oauth_token || '',
        oauth_token_secret: parsed.oauth_token_secret || '',
        oauth_callback_confirmed: parsed.oauth_callback_confirmed || '',
        oauth_verifier: parsed.oauth_verifier,
      } as OAuthTokenResponse;
    } catch (error) {
      throw new Error(`Failed to get request token: ${error}`);
    }
  }

  /**
   * Get authorization URL for user to authorize the application
   */
  getAuthorizationUrl(requestToken: string): string {
    const params = new URLSearchParams({
      oauth_token: requestToken,
    });
    return `https://api.login.yahoo.com/oauth/v2/request_auth?${params.toString()}`;
  }

  /**
   * Exchange request token for access token
   */
  async getAccessToken(
    requestToken: string,
    requestTokenSecret: string,
    verifier: string
  ): Promise<OAuthAccessTokenResponse> {
    const requestData = {
      url: 'https://api.login.yahoo.com/oauth/v2/get_token',
      method: 'POST',
      data: {
        oauth_token: requestToken,
        oauth_verifier: verifier,
      },
    };

    const authHeader = this.oauth.toHeader(
      this.oauth.authorize(requestData, {
        key: requestTokenSecret,
        secret: '',
      })
    );

    try {
      const response = await axios.post(requestData.url, requestData.data, {
        headers: {
          ...authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const parsed = this.parseOAuthResponse(response.data);
      return {
        oauth_token: parsed.oauth_token || '',
        oauth_token_secret: parsed.oauth_token_secret || '',
        oauth_session_handle: parsed.oauth_session_handle,
        oauth_authorization_expires_in: parsed.oauth_authorization_expires_in,
        oauth_expires_in: parsed.oauth_expires_in,
        xoauth_yahoo_guid: parsed.xoauth_yahoo_guid,
      } as OAuthAccessTokenResponse;
    } catch (error) {
      throw new Error(`Failed to get access token: ${error}`);
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
    const requestData = {
      url: 'https://api.login.yahoo.com/oauth/v2/get_token',
      method: 'POST',
      data: {
        oauth_session_handle: sessionHandle,
      },
    };

    const authHeader = this.oauth.toHeader(
      this.oauth.authorize(requestData, {
        key: accessToken,
        secret: accessTokenSecret,
      })
    );

    try {
      const response = await axios.post(requestData.url, requestData.data, {
        headers: {
          ...authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const parsed = this.parseOAuthResponse(response.data);
      return {
        oauth_token: parsed.oauth_token || '',
        oauth_token_secret: parsed.oauth_token_secret || '',
        oauth_session_handle: parsed.oauth_session_handle,
        oauth_authorization_expires_in: parsed.oauth_authorization_expires_in,
        oauth_expires_in: parsed.oauth_expires_in,
        xoauth_yahoo_guid: parsed.xoauth_yahoo_guid,
      } as OAuthAccessTokenResponse;
    } catch (error) {
      throw new Error(`Failed to refresh access token: ${error}`);
    }
  }

  /**
   * Create signed authorization header for API requests
   */
  createAuthHeader(
    method: string,
    url: string,
    data?: any
  ): Record<string, string> {
    const requestData = {
      url,
      method,
      data: data || {},
    };

    const authHeader = this.oauth.toHeader(
      this.oauth.authorize(requestData, {
        key: this.credentials.accessToken || '',
        secret: this.credentials.accessTokenSecret || '',
      })
    );

    return authHeader as unknown as Record<string, string>;
  }

  /**
   * Parse OAuth response string into object
   */
  private parseOAuthResponse(responseString: string): Record<string, string> {
    const params = new URLSearchParams(responseString);
    const result: Record<string, string> = {};
    
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    
    return result;
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
   * Check if we have valid access token
   */
  hasValidAccessToken(): boolean {
    return !!(this.credentials.accessToken && this.credentials.accessTokenSecret);
  }
}
