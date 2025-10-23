import { YahooOAuthClient } from '../oauth/oauth-client.js';
import {
  YahooApiResponse,
  YahooApiError,
  Game,
  GamesCollection,
  League,
  Team,
  Player,
  Transaction,
  Standing,
  Matchup,
  User,
  UsersCollection,
  LeagueFilters,
  PlayerFilters,
  TransactionFilters,
  OAuthCredentials,
  LeagueSettings,
  YahooFantasyError,
  RosterLockedError,
  RosterConstraintError,
  AuthenticationError,
  InsufficientPermissionsError,
  NetworkError,
  RateLimitError,
} from '../types/index.js';

export class YahooFantasyClient {
  private oauthClient: YahooOAuthClient;
  private baseUrl = 'https://fantasysports.yahooapis.com/fantasy/v2';
  private tokenSaveCallback?: (credentials: OAuthCredentials) => Promise<void>;
  private isRefreshing = false;
  private refreshPromise?: Promise<void>;
  private requestTimeout = 60000; // 60 seconds default timeout (increased for deployed environments)
  private maxRetries = 3; // Maximum number of retries for failed requests
  private retryDelay = 1000; // Initial retry delay in milliseconds
  private maxRetryDelay = 10000; // Maximum retry delay
  private circuitBreakerThreshold = 5; // Number of consecutive failures before circuit opens
  private circuitBreakerTimeout = 60000; // Circuit breaker timeout in milliseconds
  private consecutiveFailures = 0; // Track consecutive failures
  private circuitOpenTime = 0; // When circuit was opened

  constructor(credentials: OAuthCredentials, tokenSaveCallback?: (credentials: OAuthCredentials) => Promise<void>) {
    this.oauthClient = new YahooOAuthClient(credentials);
    this.tokenSaveCallback = tokenSaveCallback;
    
    // Set timeout based on environment
    if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
      this.requestTimeout = 120000; // 120 seconds for production/deployed environments
      this.maxRetries = 5; // More retries in production
    } else {
      this.requestTimeout = 30000; // 30 seconds for local development
      this.maxRetries = 2; // Fewer retries in development
    }
  }

  /**
   * Update OAuth credentials
   */
  updateCredentials(credentials: Partial<OAuthCredentials>): void {
    this.oauthClient.updateCredentials(credentials);
  }

  /**
   * Set token save callback
   */
  setTokenSaveCallback(callback: (credentials: OAuthCredentials) => Promise<void>): void {
    this.tokenSaveCallback = callback;
  }

  /**
   * Check if token needs refresh (within 5 minutes of expiration)
   */
  private needsTokenRefresh(): boolean {
    const credentials = this.oauthClient.getCredentials();
    
    if (!credentials.tokenExpiresAt) {
      // No expiration info, don't proactively refresh
      return false;
    }

    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    // Refresh if token expires within 5 minutes
    return now >= (credentials.tokenExpiresAt - fiveMinutes);
  }

  /**
   * Refresh access token using session handle
   */
  private async refreshToken(): Promise<void> {
    // If already refreshing, wait for that to complete
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const credentials = this.oauthClient.getCredentials();
        
        if (!credentials.sessionHandle) {
          throw new Error('No session handle available for token refresh. Please re-authenticate.');
        }

        if (!credentials.accessToken) {
          throw new Error('No access token available. Please authenticate first.');
        }

        console.error('🔄 Refreshing access token...');
        
        // OAuth 2.0 uses refresh token (stored in sessionHandle)
        const newTokens = await this.oauthClient.refreshAccessToken(
          credentials.sessionHandle
        );

        // Calculate token expiration time
        const now = Date.now();
        const expiresIn = newTokens.oauth_expires_in ? parseInt(newTokens.oauth_expires_in) * 1000 : 3600 * 1000; // Default 1 hour
        const tokenExpiresAt = now + expiresIn;

        // Update credentials with new tokens and expiration info
        const updatedCredentials: OAuthCredentials = {
          ...credentials,
          accessToken: newTokens.oauth_token,
          accessTokenSecret: newTokens.oauth_token_secret,
          sessionHandle: newTokens.oauth_session_handle || credentials.sessionHandle,
          tokenExpiresAt,
          tokenRefreshedAt: now,
        };

        this.oauthClient.updateCredentials(updatedCredentials);

        // Save tokens if callback is provided
        if (this.tokenSaveCallback) {
          await this.tokenSaveCallback(updatedCredentials);
        }

        console.error('✅ Access token refreshed successfully');
        console.error(`   Token expires at: ${new Date(tokenExpiresAt).toISOString()}`);
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = undefined;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Parse Yahoo API error response and throw appropriate error type
   */
  private parseAndThrowError(
    statusCode: number,
    errorData: any,
    endpoint: string
  ): never {
    let yahooError: YahooApiError | undefined;
    
    // Parse the error data structure
    if (errorData && typeof errorData === 'object') {
      if ('error' in errorData) {
        yahooError = errorData.error as YahooApiError;
      }
    }

    const errorDescription = yahooError?.description || 'Unknown error';
    const lowerDescription = errorDescription.toLowerCase();
    
    // Detect roster lock errors
    if (statusCode === 400 && lowerDescription.includes('cannot make changes to your roster')) {
      // Extract team key and date from endpoint if possible
      const teamKeyMatch = endpoint.match(/team\/([^\/]+)/);
      const teamKey = teamKeyMatch ? teamKeyMatch[1] : undefined;
      
      // Try to parse date from the error context or endpoint
      const dateMatch = endpoint.match(/date=([^&]+)/);
      const date = dateMatch ? dateMatch[1] : undefined;
      
      throw new RosterLockedError(
        errorDescription,
        date,
        teamKey,
        yahooError
      );
    }
    
    // Detect roster constraint errors (position filled, invalid position, etc.)
    if (statusCode === 400) {
      let constraintType: string | undefined;
      
      if (lowerDescription.includes('position has already been filled') || 
          lowerDescription.includes('that position has already been filled')) {
        constraintType = 'position_filled';
      } else if (lowerDescription.includes('not eligible') || 
                 lowerDescription.includes('invalid position')) {
        constraintType = 'invalid_position';
      } else if (lowerDescription.includes('roster limit') || 
                 lowerDescription.includes('too many players')) {
        constraintType = 'roster_limit';
      }
      
      if (constraintType) {
        // Try to extract position and player key from endpoint
        const teamKeyMatch = endpoint.match(/team\/([^\/]+)/);
        const teamKey = teamKeyMatch ? teamKeyMatch[1] : undefined;
        
        throw new RosterConstraintError(
          errorDescription,
          constraintType,
          undefined, // position - would need to parse from request data
          undefined, // playerKey - would need to parse from request data
          yahooError
        );
      }
    }
    
    // Detect authentication errors
    if (statusCode === 401) {
      throw new AuthenticationError(errorDescription, statusCode);
    }
    
    // Detect permission errors
    if (statusCode === 403) {
      throw new InsufficientPermissionsError(errorDescription, undefined, yahooError);
    }
    
    // Detect rate limiting errors
    if (statusCode === 429) {
      // Try to extract retry-after header from the original response if available
      throw new RateLimitError(errorDescription || 'Rate limit exceeded', undefined, yahooError);
    }
    
    // Generic Yahoo Fantasy error
    throw new YahooFantasyError(
      errorDescription,
      `HTTP_${statusCode}`,
      statusCode,
      yahooError
    );
  }

  /**
   * Calculate exponential backoff delay for retries
   */
  private calculateRetryDelay(attempt: number): number {
    const delay = this.retryDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, this.maxRetryDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(): boolean {
    if (this.consecutiveFailures >= this.circuitBreakerThreshold) {
      const now = Date.now();
      if (now - this.circuitOpenTime > this.circuitBreakerTimeout) {
        // Circuit breaker timeout expired, allow one request to test
        console.error('🔄 Circuit breaker timeout expired, allowing test request');
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Record successful request (reset circuit breaker)
   */
  private recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.circuitOpenTime = 0;
  }

  /**
   * Record failed request (increment circuit breaker)
   */
  private recordFailure(): void {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.circuitBreakerThreshold) {
      this.circuitOpenTime = Date.now();
      console.error(`🚨 Circuit breaker opened after ${this.consecutiveFailures} consecutive failures`);
    }
  }

  /**
   * Make authenticated request to Yahoo Fantasy API
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT',
    endpoint: string,
    data?: any,
    retryCount = 0
  ): Promise<T> {
    if (!this.oauthClient.hasValidAccessToken()) {
      throw new AuthenticationError('No valid access token available. Please authenticate first.');
    }

    // Check circuit breaker
    if (this.isCircuitOpen()) {
      throw new NetworkError('Circuit breaker is open due to consecutive failures. Please try again later.');
    }

    // Proactively refresh token if it's close to expiration
    if (this.needsTokenRefresh() && !this.isRefreshing) {
      const credentials = this.oauthClient.getCredentials();
      if (credentials.sessionHandle) {
        console.error('⏰ Token expiring soon, proactively refreshing...');
        await this.refreshToken();
      }
    }

    // Use native XML format for better performance and reliability
    const url = `${this.baseUrl}${endpoint}`;
    const authHeader = this.oauthClient.createAuthHeader(method, url, data);

    // Detect if data is XML (starts with <?xml)
    const isXmlData = typeof data === 'string' && data.trim().startsWith('<?xml');
    
    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...authHeader,
        // Use XML format for all requests for better performance and reliability
        'Content-Type': isXmlData ? 'application/xml' : 'application/xml',
        'Accept': 'application/xml',
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = data;
    }

    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`⏰ Request timeout after ${this.requestTimeout}ms for ${method} ${endpoint}`);
      controller.abort();
    }, this.requestTimeout);
    fetchOptions.signal = controller.signal;

    try {
      console.error(`🚀 Making ${method} request to ${endpoint} (timeout: ${this.requestTimeout}ms, retry: ${retryCount}/${this.maxRetries})`);
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      console.error(`✅ Request completed successfully for ${method} ${endpoint}`);
      
      // Record successful request
      this.recordSuccess();
      
      if (!response.ok) {
        // Try to get error details from response
        const contentType = response.headers.get('content-type');
        let errorData: any = null;
        
        try {
          const errorText = await response.text();
          // For XML responses, we'll parse the error text directly
          // Yahoo API returns XML error responses with error details
          if (contentType?.includes('application/xml')) {
            // Extract error information from XML if possible
            const errorMatch = errorText.match(/<description>(.*?)<\/description>/);
            if (errorMatch) {
              errorData = { error: { description: errorMatch[1] } };
            }
          } else if (contentType?.includes('application/json')) {
            errorData = JSON.parse(errorText);
          }
        } catch (e) {
          // Ignore parsing errors
        }
        
        if (response.status === 401 && retryCount < 1) {
          // Token expired, try to refresh and retry once
          const credentials = this.oauthClient.getCredentials();
          if (credentials.sessionHandle) {
            console.error('⚠️  Authentication failed (401), attempting token refresh...');
            await this.refreshToken();
            // Retry the request with new token
            return this.makeRequest<T>(method, endpoint, data, retryCount + 1);
          } else {
            throw new AuthenticationError('Authentication failed. No session handle available for token refresh. Please re-authenticate.');
          }
        } else if (response.status === 401) {
          throw new AuthenticationError('Authentication failed after token refresh. Please re-authenticate.');
        }
        
        // Check for rate limiting with Retry-After header
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;
          throw new RateLimitError(
            'Rate limit exceeded. Too many requests to Yahoo Fantasy API.',
            retrySeconds,
            errorData?.error
          );
        }
        
        // Parse and throw specific error type
        this.parseAndThrowError(response.status, errorData, endpoint);
      }

      // Return XML response directly for agentic flows
      const contentType = response.headers.get('content-type');
      const responseText = await response.text();
      
      // Check if we actually got XML
      if (!contentType?.includes('application/xml') && !responseText.trim().startsWith('<?xml')) {
        console.error('⚠️  Received non-XML response:');
        console.error('   Content-Type:', contentType);
        console.error('   Response preview:', responseText.substring(0, 200));
        throw new Error(`Expected XML but received ${contentType}. Response: ${responseText.substring(0, 100)}`);
      }
      
      // Return the XML response directly - no parsing needed for agentic flows
      // The XML contains all the data that agents can process directly
      return responseText as T;
    } catch (error: any) {
      // Clear timeout if we hit an error
      clearTimeout(timeoutId);
      
      // Record failure for circuit breaker
      this.recordFailure();
      
      // Re-throw our custom errors
      if (error instanceof YahooFantasyError) {
        throw error;
      }
      
      // Handle network errors with retry logic
      if (error.name === 'AbortError') {
        if (retryCount < this.maxRetries) {
          const delay = this.calculateRetryDelay(retryCount + 1);
          console.error(`⏰ Request timeout after ${this.requestTimeout}ms for ${method} ${endpoint}, retrying (${retryCount + 1}/${this.maxRetries}) in ${delay}ms...`);
          console.error(`   Environment: ${process.env.NODE_ENV || 'development'}, Railway: ${process.env.RAILWAY_ENVIRONMENT || 'false'}`);
          await this.sleep(delay);
          return this.makeRequest(method, endpoint, data, retryCount + 1);
        }
        console.error(`❌ Final timeout failure for ${method} ${endpoint} after ${this.maxRetries} retries`);
        throw new NetworkError(`Request timeout after ${this.requestTimeout}ms (${this.maxRetries} retries attempted). This may indicate network issues or Yahoo API slowness.`, error);
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        if (retryCount < this.maxRetries) {
          const delay = this.calculateRetryDelay(retryCount + 1);
          console.error(`🌐 Network connection failed, retrying (${retryCount + 1}/${this.maxRetries}) in ${delay}ms...`);
          await this.sleep(delay);
          return this.makeRequest(method, endpoint, data, retryCount + 1);
        }
        throw new NetworkError('Network connection failed. Please check your internet connection.', error);
      }
      
      // Handle other fetch errors
      if (error instanceof TypeError || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new NetworkError(`Network error: ${error.message}`, error);
      }
      
      // Generic error fallback
      throw new YahooFantasyError(`API request failed: ${error.message}`, 'REQUEST_FAILED', undefined);
    }
  }

  /**
   * Get user's games
   */
  async getUserGames(gameKeys?: string[]): Promise<string> {
    const gameKeysParam = gameKeys ? `;game_keys=${gameKeys.join(',')}` : '';
    return this.makeRequest<string>('GET', `/users;use_login=1/games${gameKeysParam}`);
  }

  /**
   * Get detailed game information
   */
  async getGameInfo(gameKey: string): Promise<string> {
    return this.makeRequest<string>('GET', `/game/${gameKey}`);
  }

  /**
   * Get game metadata and settings
   */
  async getGameMetadata(gameKey: string): Promise<string> {
    return this.makeRequest<string>('GET', `/game/${gameKey}/metadata`);
  }

  /**
   * Get stat categories for a game
   */
  async getGameStatCategories(gameKey: string): Promise<string> {
    return this.makeRequest<string>('GET', `/game/${gameKey}/stat_categories`);
  }

  /**
   * Get user's leagues for a specific game
   */
  async getUserLeagues(gameKey: string): Promise<{ leagues: League[]; count: number }> {
    const response = await this.makeRequest<any>('GET', `/users;use_login=1/games;game_keys=${gameKey}/leagues`);
    
    // Yahoo API returns deeply nested object structure with numeric keys
    
    try {
      // Debug: Log the structure we received
      if (!response || typeof response !== 'object') {
        console.error('❌ getUserLeagues: Invalid response type:', typeof response);
        return { leagues: [], count: 0 };
      }
      
      const usersObj = response.users;
      if (!usersObj || typeof usersObj !== 'object') {
        console.error('❌ getUserLeagues: Missing or invalid users object');
        console.error('   Response keys:', Object.keys(response));
        return { leagues: [], count: 0 };
      }
      
      // Get first user (users.0)
      const firstUser = usersObj['0'] || usersObj[0];
      if (!firstUser || !firstUser.user || !Array.isArray(firstUser.user)) {
        return { leagues: [], count: 0 };
      }
      
      // Find games object in user array
      let gamesObj = null;
      for (const item of firstUser.user) {
        if (item.games) {
          gamesObj = item.games;
          break;
        }
      }
      
      if (!gamesObj || typeof gamesObj !== 'object') {
        return { leagues: [], count: 0 };
      }
      
      // Get first game (games.0)
      const firstGame = gamesObj['0'] || gamesObj[0];
      if (!firstGame || !firstGame.game || !Array.isArray(firstGame.game)) {
        return { leagues: [], count: 0 };
      }
      
      // Find leagues object in game array
      let leaguesObj = null;
      for (const item of firstGame.game) {
        if (item.leagues) {
          leaguesObj = item.leagues;
          break;
        }
      }
      
      if (!leaguesObj || typeof leaguesObj !== 'object') {
        return { leagues: [], count: 0 };
      }
      
      // Extract count
      const leagueCount = leaguesObj.count || 0;
      
      // Extract league objects from numeric keys
      const leagues: any[] = [];
      for (const key in leaguesObj) {
        if (key !== 'count' && leaguesObj[key]?.league) {
          leagues.push(leaguesObj[key].league);
        }
      }
      
      return {
        leagues,
        count: leagueCount || leagues.length,
      };
    } catch (error: any) {
      console.error('❌ Error parsing getUserLeagues response:', error.message);
      return { leagues: [], count: 0 };
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(): Promise<User> {
    const response = await this.makeRequest<any>('GET', `/users;use_login=1`);
    
    // Yahoo API returns deeply nested object structure with numeric keys
    
    try {
      const usersObj = response.users;
      if (!usersObj || typeof usersObj !== 'object') {
        throw new Error('No users object in response');
      }
      
      // Get first user (users.0)
      const firstUser = usersObj['0'] || usersObj[0];
      if (!firstUser || !firstUser.user || !Array.isArray(firstUser.user)) {
        throw new Error('No user array in response');
      }
      
      // Merge all user profile data from array
      let profile: any = {};
      for (const item of firstUser.user) {
        if (typeof item === 'object' && !Array.isArray(item)) {
          profile = { ...profile, ...item };
        }
      }
      
      return profile as User;
    } catch (error: any) {
      console.error('❌ Error parsing getUserProfile response:', error.message);
      throw error;
    }
  }

  /**
   * Get all teams for the current user across games
   */
  async getUserTeams(): Promise<{ teams: Team[]; count: number }> {
    const response = await this.makeRequest<any>('GET', `/users;use_login=1/teams`);
    
    // Yahoo API returns deeply nested object structure with numeric keys
    
    try {
      const usersObj = response.users;
      if (!usersObj || typeof usersObj !== 'object') {
        return { teams: [], count: 0 };
      }
      
      // Get first user (users.0)
      const firstUser = usersObj['0'] || usersObj[0];
      if (!firstUser || !firstUser.user || !Array.isArray(firstUser.user)) {
        return { teams: [], count: 0 };
      }
      
      // Find teams object in user array
      let teamsObj = null;
      for (const item of firstUser.user) {
        if (item.teams) {
          teamsObj = item.teams;
          break;
        }
      }
      
      if (!teamsObj || typeof teamsObj !== 'object') {
        return { teams: [], count: 0 };
      }
      
      // Extract count
      const teamCount = teamsObj.count || 0;
      
      // Extract team objects from numeric keys
      const teams: any[] = [];
      for (const key in teamsObj) {
        if (key !== 'count' && teamsObj[key]?.team) {
          teams.push(teamsObj[key].team);
        }
      }
      
      return {
        teams,
        count: teamCount || teams.length,
      };
    } catch (error: any) {
      console.error('❌ Error parsing getUserTeams response:', error.message);
      return { teams: [], count: 0 };
    }
  }

  /**
   * Get historical league data (past seasons)
   */
  async getLeagueHistory(leagueKey: string): Promise<any> {
    // Yahoo API allows fetching historical data via past league keys
    // This returns league information with historical standings and results
    return this.makeRequest<any>('GET', `/league/${leagueKey};out=standings,settings,scoreboard`);
  }

  /**
   * Get historical team performance data
   */
  async getTeamHistory(teamKey: string): Promise<any> {
    // Get team with historical stats, matchups, and standings
    return this.makeRequest<any>('GET', `/team/${teamKey};out=stats,standings,matchups`);
  }

  /**
   * Get live scoring updates for a league
   */
  async getLiveScores(leagueKey: string, week?: string): Promise<{ matchups: Matchup[]; count: number }> {
    // Live scores are available via scoreboard with current stats
    const weekParam = week ? `;week=${week}` : '';
    const endpoint = `/league/${leagueKey}/scoreboard${weekParam};out=matchups`;
    const response = await this.makeRequest<any>('GET', endpoint);
    return {
      matchups: response.scoreboard?.matchups || [],
      count: response.scoreboard?.count || 0,
    };
  }

  /**
   * Get real-time game updates
   */
  async getGameUpdates(gameKey: string): Promise<any> {
    // Get current game state and updates
    return this.makeRequest<any>('GET', `/game/${gameKey};out=game_weeks,stat_categories`);
  }

  /**
   * Get league details
   */
  async getLeague(leagueKey: string, filters?: LeagueFilters): Promise<string> {
    const params = this.buildFilterParams(filters);
    const endpoint = `/league/${leagueKey}${params}`;
    return this.makeRequest<string>('GET', endpoint);
  }

  /**
   * Get league standings
   */
  async getLeagueStandings(leagueKey: string): Promise<string> {
    // Use longer timeout for standings as it can be slow
    const originalTimeout = this.requestTimeout;
    this.requestTimeout = Math.max(this.requestTimeout, 90000); // At least 90 seconds for standings
    
    try {
      return this.makeRequest<string>('GET', `/league/${leagueKey}/standings`);
    } finally {
      this.requestTimeout = originalTimeout;
    }
  }

  /**
   * Get league settings
   */
  async getLeagueSettings(leagueKey: string): Promise<string> {
    // Use longer timeout for league settings as it can be slow
    const originalTimeout = this.requestTimeout;
    this.requestTimeout = 120000; // 2 minutes for league settings
    
    try {
      return this.makeRequest<string>('GET', `/league/${leagueKey}/settings`);
    } finally {
      // Restore original timeout
      this.requestTimeout = originalTimeout;
    }
  }

  /**
   * Get league metadata
   */
  async getLeagueMetadata(leagueKey: string): Promise<any> {
    // Use longer timeout for league metadata as it can be slow
    const originalTimeout = this.requestTimeout;
    this.requestTimeout = 90000; // 90 seconds for league metadata
    
    try {
      // Yahoo supports metadata via out param or a dedicated subresource
      // Prefer direct subresource if available
      return this.makeRequest<any>('GET', `/league/${leagueKey}/metadata`);
    } finally {
      // Restore original timeout
      this.requestTimeout = originalTimeout;
    }
  }

  /**
   * Get league rosters (all team rosters within a league)
   */
  async getLeagueRosters(leagueKey: string): Promise<string> {
    // Use longer timeout for league rosters as it can be slow
    const originalTimeout = this.requestTimeout;
    this.requestTimeout = 90000; // 90 seconds for league rosters
    
    try {
      const endpoint = `/league/${leagueKey}/teams;out=roster`;
      return this.makeRequest<string>('GET', endpoint);
    } finally {
      // Restore original timeout
      this.requestTimeout = originalTimeout;
    }
  }

  /**
   * Get draft results for a league
   */
  async getDraftResults(leagueKey: string): Promise<string> {
    return this.makeRequest<string>('GET', `/league/${leagueKey}/draftresults`);
  }

  /**
   * Get draft teams information
   */
  async getDraftTeams(leagueKey: string): Promise<string> {
    // Include draft results per team via out param
    return this.makeRequest<string>('GET', `/league/${leagueKey}/teams;out=draft_results`);
  }

  /**
   * Get draft settings for a league
   */
  async getDraftSettings(leagueKey: string): Promise<LeagueSettings> {
    // Draft settings are part of league settings
    return this.makeRequest<LeagueSettings>('GET', `/league/${leagueKey}/settings`);
  }

  /**
   * Get league teams
   */
  async getLeagueTeams(leagueKey: string, filters?: LeagueFilters): Promise<string> {
    // Use longer timeout for league teams as it can be slow
    const originalTimeout = this.requestTimeout;
    this.requestTimeout = 90000; // 90 seconds for league teams
    
    try {
      const params = this.buildFilterParams(filters);
      const endpoint = `/league/${leagueKey}/teams${params}`;
      return this.makeRequest<string>('GET', endpoint);
    } finally {
      // Restore original timeout
      this.requestTimeout = originalTimeout;
    }
  }

  /**
   * Get league scoreboard/matchups
   */
  async getLeagueScoreboard(leagueKey: string, week?: string): Promise<{ matchups: any[]; count: number }> {
    const weekParam = week ? `;week=${week}` : '';
    const endpoint = `/league/${leagueKey}/scoreboard${weekParam}`;
    const response = await this.makeRequest<any>('GET', endpoint);

    // Check if response has league array structure (similar to team endpoints)
    if (response.league && Array.isArray(response.league)) {
      for (const item of response.league) {
        if (item.scoreboard) {
          // Yahoo nests scoreboard data inside a "0" key
          const scoreboardData = item.scoreboard["0"] || item.scoreboard;
          const matchupsCollection = scoreboardData?.matchups;
          
          if (matchupsCollection && typeof matchupsCollection === 'object') {
            const matchups: any[] = [];
            for (const key in matchupsCollection) {
              if (key === 'count') continue;
              const matchupData = matchupsCollection[key]?.matchup;
              if (!matchupData) continue;
              if (Array.isArray(matchupData)) {
                matchups.push(matchupData);
              } else {
                matchups.push([matchupData]);
              }
            }
            const count = Number(matchupsCollection.count ?? matchups.length);
            return { matchups, count };
          }
        }
      }
    }

    // Fallback: check for direct scoreboard.matchups property
    const matchupsCollection = response.scoreboard?.matchups;
    if (!matchupsCollection || typeof matchupsCollection !== 'object') {
      return { matchups: [], count: 0 };
    }

    const matchups: any[] = [];
    for (const key in matchupsCollection) {
      if (key === 'count') continue;
      const matchupData = matchupsCollection[key]?.matchup;
      if (!matchupData) continue;
      if (Array.isArray(matchupData)) {
        matchups.push(matchupData);
      } else {
        matchups.push([matchupData]);
      }
    }

    const count = Number(matchupsCollection.count ?? matchups.length);
    return {
      matchups,
      count,
    };
  }

  /**
   * Get league-wide statistics
   */
  async getLeagueStats(leagueKey: string): Promise<any> {
    // Get league stats through standings and teams with stats
    return this.makeRequest<any>('GET', `/league/${leagueKey};out=standings,teams`);
  }

  /**
   * Get league transactions
   */
  async getLeagueTransactions(leagueKey: string, filters?: TransactionFilters): Promise<string> {
    const params = this.buildTransactionFilterParams(filters);
    const endpoint = `/league/${leagueKey}/transactions${params}`;
    return this.makeRequest<string>('GET', endpoint);
  }

  /**
   * Get league players
   */
  async getLeaguePlayers(leagueKey: string, filters?: PlayerFilters): Promise<string> {
    const params = this.buildPlayerFilterParams(filters);
    const endpoint = `/league/${leagueKey}/players${params}`;
    return this.makeRequest<string>('GET', endpoint);
  }

  /**
   * Get team details
   */
  async getTeam(teamKey: string, filters?: LeagueFilters): Promise<string> {
    const params = this.buildFilterParams(filters);
    const endpoint = `/team/${teamKey}${params}`;
    return this.makeRequest<string>('GET', endpoint);
  }

  /**
   * Get team statistics for specified coverage
   */
  async getTeamStats(
    teamKey: string,
    statType: 'season' | 'lastweek' | 'lastmonth' | 'date' | 'week' = 'season',
    options?: { season?: string; week?: string; date?: string }
  ): Promise<any> {
    const params: string[] = [`type=${statType}`];
    if (options?.season) params.push(`season=${options.season}`);
    if (options?.week) params.push(`week=${options.week}`);
    if (options?.date) params.push(`date=${options.date}`);
    const suffix = params.length ? `;${params.join(';')}` : '';
    return this.makeRequest<any>('GET', `/team/${teamKey}/stats${suffix}`);
  }

  /**
   * Get team roster
   */
  async getTeamRoster(teamKey: string, week?: string): Promise<string> {
    const weekParam = week ? `;week=${week}` : '';
    const endpoint = `/team/${teamKey}/roster${weekParam}`;
    return this.makeRequest<string>('GET', endpoint);
  }

  /**
   * Get team matchups
   */
  async getTeamMatchups(teamKey: string, week?: string): Promise<{ matchups: any[]; count: number }> {
    const weekParam = week ? `;week=${week}` : '';
    const endpoint = `/team/${teamKey}/matchups${weekParam}`;
    const response = await this.makeRequest<any>('GET', endpoint);

    // Check if response has team array structure (like roster endpoint)
    if (response.team && Array.isArray(response.team)) {
      for (const item of response.team) {
        if (item.matchups) {
          const matchupsCollection = item.matchups;
          const matchups: any[] = [];
          for (const key in matchupsCollection) {
            if (key === 'count') continue;
            const matchupData = matchupsCollection[key]?.matchup;
            if (!matchupData) continue;
            if (Array.isArray(matchupData)) {
              matchups.push(matchupData);
            } else {
              matchups.push([matchupData]);
            }
          }
          const count = Number(matchupsCollection.count ?? matchups.length);
          return { matchups, count };
        }
      }
    }

    // Fallback: check for direct matchups property
    const matchupsCollection = response.matchups;
    if (!matchupsCollection || typeof matchupsCollection !== 'object') {
      return { matchups: [], count: 0 };
    }

    const matchups: any[] = [];
    for (const key in matchupsCollection) {
      if (key === 'count') continue;
      const matchupData = matchupsCollection[key]?.matchup;
      if (!matchupData) continue;
      if (Array.isArray(matchupData)) {
        matchups.push(matchupData);
      } else {
        matchups.push([matchupData]);
      }
    }

    const count = Number(matchupsCollection.count ?? matchups.length);
    return {
      matchups,
      count,
    };
  }

  /**
   * Get detailed matchup information for a specific matchup
   * Includes teams, rosters, stats, and scoring details
   */
  async getMatchupDetails(
    leagueKey: string,
    week?: string,
    teamKeys?: string[]
  ): Promise<{ matchups: Matchup[]; count: number }> {
    const weekParam = week ? `;week=${week}` : '';
    const teamKeysParam = teamKeys?.length ? `;team_keys=${teamKeys.join(',')}` : '';
    // Use scoreboard with teams subresource to get detailed matchup info
    const endpoint = `/league/${leagueKey}/scoreboard${weekParam}${teamKeysParam};out=teams,matchups`;
    const response = await this.makeRequest<any>('GET', endpoint);
    return {
      matchups: response.scoreboard?.matchups || [],
      count: response.scoreboard?.count || 0,
    };
  }

  /**
   * Get team transactions
   */
  async getTeamTransactions(teamKey: string, filters?: TransactionFilters): Promise<string> {
    const params = this.buildTransactionFilterParams(filters);
    const endpoint = `/team/${teamKey}/transactions${params}`;
    return this.makeRequest<string>('GET', endpoint);
  }

  /**
   * Get player details
   */
  async getPlayer(playerKey: string): Promise<string> {
    return this.makeRequest<string>('GET', `/player/${playerKey}`);
  }

  /**
   * Get player stats
   */
  async getPlayerStats(
    playerKey: string,
    statType: 'season' | 'lastweek' | 'lastmonth' | 'date' | 'week' = 'season',
    options?: { season?: string; week?: string; date?: string }
  ): Promise<string> {
    const params: string[] = [`type=${statType}`];
    if (options?.season) params.push(`season=${options.season}`);
    if (options?.week) params.push(`week=${options.week}`);
    if (options?.date) params.push(`date=${options.date}`);
    const suffix = params.length ? `;${params.join(';')}` : '';
    return this.makeRequest<string>('GET', `/player/${playerKey}/stats${suffix}`);
  }

  /**
   * Get player ownership within a league
   */
  async getPlayerOwnership(leagueKey: string, playerKey: string): Promise<any> {
    const endpoint = `/league/${leagueKey}/players;player_keys=${playerKey}/ownership`;
    return this.makeRequest<any>('GET', endpoint);
  }

  /**
   * Get Yahoo editorial player notes
   */
  async getPlayerNotes(playerKey: string): Promise<any> {
    return this.makeRequest<any>('GET', `/player/${playerKey}/notes`);
  }

  /**
   * Search for players
   */
  async searchPlayers(
    gameKey: string,
    filters?: PlayerFilters
  ): Promise<string> {
    // Use longer timeout for player search as it can be slow
    const originalTimeout = this.requestTimeout;
    this.requestTimeout = Math.max(this.requestTimeout, 90000); // At least 90 seconds for player search
    
    try {
      const params = this.buildPlayerFilterParams(filters);
      const endpoint = `/games;game_keys=${gameKey}/players${params}`;
      return this.makeRequest<string>('GET', endpoint);
    } finally {
      this.requestTimeout = originalTimeout;
    }
  }

  /**
   * Advanced player search by position within a league
   */
  async searchPlayersByPosition(
    leagueKey: string,
    position: string,
    filters?: PlayerFilters
  ): Promise<string> {
    const params = this.buildPlayerFilterParams(filters);
    const endpoint = `/league/${leagueKey}/players;position=${position}${params}`;
    return this.makeRequest<string>('GET', endpoint);
  }

  /**
   * Get players on injured reserve for a team
   */
  async getInjuredReserve(teamKey: string): Promise<{ players: Player[]; count: number }> {
    // Get roster with IR players - typically shown via status
    const endpoint = `/team/${teamKey}/roster`;
    const response = await this.makeRequest<any>('GET', endpoint);
    const allPlayers = response.roster?.players || [];
    // Filter for injured/IR status players
    const irPlayers = allPlayers.filter((p: Player) => 
      p.status === 'IR' || 
      p.status === 'PUP' || 
      p.status === 'O' || 
      p.status === 'D' ||
      p.on_disabled_list === '1'
    );
    return {
      players: irPlayers,
      count: irPlayers.length,
    };
  }

  /**
   * Get available free agents
   */
  async getFreeAgents(
    leagueKey: string,
    position?: string,
    status = 'A',
    count = 25,
    start = 0
  ): Promise<string> {
    const positionParam = position ? `;position=${position}` : '';
    const endpoint = `/league/${leagueKey}/players${positionParam};status=${status};count=${count};start=${start}`;
    
    // Use longer timeout for free agents as it's a heavy operation
    const originalTimeout = this.requestTimeout;
    this.requestTimeout = Math.max(this.requestTimeout, 120000); // At least 2 minutes for free agents
    
    try {
      return this.makeRequest<string>('GET', endpoint);
    } finally {
      // Restore original timeout
      this.requestTimeout = originalTimeout;
    }
  }

  /**
   * Add player to team
   */
  async addPlayer(leagueKey: string, teamKey: string, playerKey: string): Promise<string> {
    const xmlData = this.buildAddPlayerXML(playerKey, teamKey);
    return this.makeRequest<string>('POST', `/league/${leagueKey}/transactions`, xmlData);
  }

  /**
   * Drop player from team
   */
  async dropPlayer(leagueKey: string, teamKey: string, playerKey: string): Promise<string> {
    const xmlData = this.buildDropPlayerXML(playerKey, teamKey);
    return this.makeRequest<string>('POST', `/league/${leagueKey}/transactions`, xmlData);
  }

  /**
   * Add and drop players in one transaction
   */
  async addDropPlayers(
    leagueKey: string,
    teamKey: string,
    addPlayerKey: string,
    dropPlayerKey: string,
    faabBid?: number
  ): Promise<string> {
    const xmlData = this.buildAddDropPlayerXML(addPlayerKey, dropPlayerKey, teamKey, faabBid);
    return this.makeRequest<string>('POST', `/league/${leagueKey}/transactions`, xmlData);
  }

  /**
   * Get pending waiver claims for a team
   */
  async getWaiverClaims(teamKey: string): Promise<string> {
    const endpoint = `/team/${teamKey}/transactions;types=waiver`;
    return this.makeRequest<string>('GET', endpoint);
  }

  /**
   * Propose a trade
   */
  async proposeTrade(
    leagueKey: string,
    traderTeamKey: string,
    tradeeTeamKey: string,
    players: Array<{ playerKey: string; sourceTeamKey: string; destinationTeamKey: string }>,
    tradeNote?: string
  ): Promise<Transaction> {
    const xmlData = this.buildTradeXML(traderTeamKey, tradeeTeamKey, players, tradeNote);
    const response = await this.makeRequest<any>('POST', `/league/${leagueKey}/transactions`, xmlData);
    return response.transaction;
  }

  /**
   * Accept a pending trade
   */
  async acceptTrade(
    leagueKey: string,
    transactionKey: string,
    tradeNote?: string
  ): Promise<Transaction> {
    const xmlData = this.buildAcceptTradeXML(transactionKey, tradeNote);
    const response = await this.makeRequest<any>('POST', `/league/${leagueKey}/transactions`, xmlData);
    return response.transaction;
  }

  /**
   * Reject a pending trade
   */
  async rejectTrade(
    leagueKey: string,
    transactionKey: string,
    tradeNote?: string
  ): Promise<Transaction> {
    const xmlData = this.buildRejectTradeXML(transactionKey, tradeNote);
    const response = await this.makeRequest<any>('POST', `/league/${leagueKey}/transactions`, xmlData);
    return response.transaction;
  }

  /**
   * Cancel a trade proposal
   */
  async cancelTrade(
    leagueKey: string,
    transactionKey: string
  ): Promise<Transaction> {
    const xmlData = this.buildCancelTradeXML(transactionKey);
    const response = await this.makeRequest<any>('POST', `/league/${leagueKey}/transactions`, xmlData);
    return response.transaction;
  }

  /**
   * Vote on a trade (if league allows voting)
   */
  async voteOnTrade(
    leagueKey: string,
    transactionKey: string,
    vote: 'allow' | 'veto'
  ): Promise<Transaction> {
    const xmlData = this.buildVoteTradeXML(transactionKey, vote);
    const response = await this.makeRequest<any>('POST', `/league/${leagueKey}/transactions`, xmlData);
    return response.transaction;
  }

  /**
   * Cancel a waiver claim
   */
  async cancelWaiverClaim(
    leagueKey: string,
    transactionKey: string
  ): Promise<Transaction> {
    const xmlData = this.buildCancelWaiverXML(transactionKey);
    const response = await this.makeRequest<any>('POST', `/league/${leagueKey}/transactions`, xmlData);
    return response.transaction;
  }

  /**
   * Edit a pending waiver claim
   */
  async editWaiverClaim(
    leagueKey: string,
    transactionKey: string,
    faabBid: number,
    priority?: number
  ): Promise<Transaction> {
    const xmlData = this.buildEditWaiverXML(transactionKey, faabBid, priority);
    const response = await this.makeRequest<any>('POST', `/league/${leagueKey}/transactions`, xmlData);
    return response.transaction;
  }

  /**
   * Edit league settings (commissioner only)
   * Update various league settings like draft time, waiver rules, trade settings, etc.
   */
  async editLeagueSettings(
    leagueKey: string,
    settings: {
      draftTime?: string;
      draftType?: string;
      isAuctionDraft?: string;
      waiverType?: string;
      waiverTime?: string;
      tradeEndDate?: string;
      tradeRejectTime?: string;
      postDraftPlayers?: string;
      maxTeams?: string;
      [key: string]: string | undefined;
    }
  ): Promise<LeagueSettings> {
    const xmlData = this.buildEditLeagueSettingsXML(settings);
    const response = await this.makeRequest<any>('POST', `/league/${leagueKey}/settings`, xmlData);
    return response.settings;
  }

  /**
   * Manage team roster (commissioner only)
   * Commissioner can add/drop players for any team in the league
   */
  async manageRoster(
    leagueKey: string,
    teamKey: string,
    action: 'add' | 'drop' | 'add_drop',
    players: {
      addPlayerKey?: string;
      dropPlayerKey?: string;
    }
  ): Promise<Transaction> {
    const xmlData = this.buildManageRosterXML(action, teamKey, players);
    const response = await this.makeRequest<any>('POST', `/league/${leagueKey}/transactions`, xmlData);
    return response.transaction;
  }

  /**
   * Process pending transactions (commissioner only)
   * Commissioner can approve or reject pending transactions
   */
  async processTransaction(
    leagueKey: string,
    transactionKey: string,
    action: 'approve' | 'reject',
    note?: string
  ): Promise<Transaction> {
    const xmlData = this.buildProcessTransactionXML(transactionKey, action, note);
    const response = await this.makeRequest<any>('POST', `/league/${leagueKey}/transactions`, xmlData);
    return response.transaction;
  }

  /**
   * Edit team roster positions
   * Set player positions on a team's roster (lineup changes)
   */
  async editTeamRoster(
    leagueKey: string,
    teamKey: string,
    playerChanges: Array<{
      playerKey: string;
      position: string;
    }>,
    options?: {
      date?: string;
      week?: string | number;
      coverageType?: 'date' | 'week';
      isCommissionerAction?: boolean;
    }
  ): Promise<string> {
    try {
      console.error('[editTeamRoster] Building XML with options:', JSON.stringify(options));
      const xmlData = this.buildEditTeamRosterXML(teamKey, playerChanges, options);
      console.error('[editTeamRoster] XML built successfully:', xmlData.substring(0, 200));
      // Yahoo API requires PUT method for roster position changes, not POST
      const response = await this.makeRequest<string>('PUT', `/team/${teamKey}/roster`, xmlData);
      console.error('[editTeamRoster] Request successful');
      console.error('[editTeamRoster] Returning XML response');
      return response;
    } catch (error: any) {
      console.error('[editTeamRoster] Error:', error?.message || error);
      console.error('[editTeamRoster] Error stack:', error?.stack);
      throw error;
    }
  }

  // XML parsing helper methods removed - now returning XML directly for agentic flows

  // Complex JSON parsing methods removed - now returning XML directly for agentic flows

  // League collection parsing methods removed - now returning XML directly for agentic flows

  // Team collection parsing methods removed - now returning XML directly for agentic flows

  /**
   * Build filter parameters for league requests
   */
  private buildFilterParams(filters?: LeagueFilters): string {
    if (!filters) return '';

    const params: string[] = [];

    if (filters.game_keys?.length) {
      params.push(`game_keys=${filters.game_keys.join(',')}`);
    }
    if (filters.league_keys?.length) {
      params.push(`league_keys=${filters.league_keys.join(',')}`);
    }
    if (filters.team_keys?.length) {
      params.push(`team_keys=${filters.team_keys.join(',')}`);
    }
    if (filters.player_keys?.length) {
      params.push(`player_keys=${filters.player_keys.join(',')}`);
    }

    const outParams: string[] = [];
    if (filters.draft_results) outParams.push('draft_results');
    if (filters.draft_teams) outParams.push('draft_teams');
    if (filters.players) outParams.push('players');
    if (filters.stats) outParams.push('stats');
    if (filters.standings) outParams.push('standings');
    if (filters.rosters) outParams.push('rosters');
    if (filters.matchups) outParams.push('matchups');
    if (filters.scoreboard) outParams.push('scoreboard');
    if (filters.transactions) outParams.push('transactions');
    if (filters.settings) outParams.push('settings');
    if (filters.metadata) outParams.push('metadata');

    if (outParams.length) {
      params.push(`out=${outParams.join(',')}`);
    }

    return params.length ? `;${params.join(';')}` : '';
  }

  /**
   * Build filter parameters for player requests
   */
  private buildPlayerFilterParams(filters?: PlayerFilters): string {
    if (!filters) return '';

    const params: string[] = [];

    if (filters.position) {
      params.push(`position=${filters.position}`);
    }
    if (filters.status) {
      params.push(`status=${filters.status}`);
    }
    if (filters.search) {
      params.push(`search=${encodeURIComponent(filters.search)}`);
    }
    if (filters.sort) {
      params.push(`sort=${filters.sort}`);
    }
    if (filters.sort_type) {
      params.push(`sort_type=${filters.sort_type}`);
    }
    if (filters.sort_season) {
      params.push(`sort_season=${filters.sort_season}`);
    }
    if (filters.sort_week) {
      params.push(`sort_week=${filters.sort_week}`);
    }
    if (filters.count) {
      params.push(`count=${filters.count}`);
    }
    if (filters.start) {
      params.push(`start=${filters.start}`);
    }

    return params.length ? `;${params.join(';')}` : '';
  }

  /**
   * Build filter parameters for transaction requests
   */
  private buildTransactionFilterParams(filters?: TransactionFilters): string {
    if (!filters) return '';

    const params: string[] = [];

    if (filters.type) {
      params.push(`type=${filters.type}`);
    }
    if (filters.types?.length) {
      params.push(`types=${filters.types.join(',')}`);
    }
    if (filters.team_key) {
      params.push(`team_key=${filters.team_key}`);
    }
    if (filters.count) {
      params.push(`count=${filters.count}`);
    }

    return params.length ? `;${params.join(';')}` : '';
  }

  /**
   * Build XML for adding a player
   */
  private buildAddPlayerXML(playerKey: string, teamKey: string): string {
    return `<?xml version='1.0'?>
<fantasy_content>
  <transaction>
    <type>add</type>
    <player>
      <player_key>${playerKey}</player_key>
      <transaction_data>
        <type>add</type>
        <destination_team_key>${teamKey}</destination_team_key>
      </transaction_data>
    </player>
  </transaction>
</fantasy_content>`;
  }

  /**
   * Build XML for dropping a player
   */
  private buildDropPlayerXML(playerKey: string, teamKey: string): string {
    return `<?xml version='1.0'?>
<fantasy_content>
  <transaction>
    <type>drop</type>
    <player>
      <player_key>${playerKey}</player_key>
      <transaction_data>
        <type>drop</type>
        <source_team_key>${teamKey}</source_team_key>
      </transaction_data>
    </player>
  </transaction>
</fantasy_content>`;
  }

  /**
   * Build XML for add/drop transaction
   */
  private buildAddDropPlayerXML(
    addPlayerKey: string,
    dropPlayerKey: string,
    teamKey: string,
    faabBid?: number
  ): string {
    const faabBidXML = faabBid ? `    <faab_bid>${faabBid}</faab_bid>\n` : '';
    
    return `<?xml version='1.0'?>
<fantasy_content>
  <transaction>
    <type>add/drop</type>
${faabBidXML}    <players>
      <player>
        <player_key>${addPlayerKey}</player_key>
        <transaction_data>
          <type>add</type>
          <destination_team_key>${teamKey}</destination_team_key>
        </transaction_data>
      </player>
      <player>
        <player_key>${dropPlayerKey}</player_key>
        <transaction_data>
          <type>drop</type>
          <source_team_key>${teamKey}</source_team_key>
        </transaction_data>
      </player>
    </players>
  </transaction>
</fantasy_content>`;
  }

  /**
   * Build XML for trade proposal
   */
  private buildTradeXML(
    traderTeamKey: string,
    tradeeTeamKey: string,
    players: Array<{ playerKey: string; sourceTeamKey: string; destinationTeamKey: string }>,
    tradeNote?: string
  ): string {
    const tradeNoteXML = tradeNote ? `    <trade_note>${tradeNote}</trade_note>\n` : '';
    const playersXML = players.map(player => `      <player>
        <player_key>${player.playerKey}</player_key>
        <transaction_data>
          <type>pending_trade</type>
          <source_team_key>${player.sourceTeamKey}</source_team_key>
          <destination_team_key>${player.destinationTeamKey}</destination_team_key>
        </transaction_data>
      </player>`).join('\n');

    return `<?xml version='1.0'?>
<fantasy_content>
  <transaction>
    <type>pending_trade</type>
    <trader_team_key>${traderTeamKey}</trader_team_key>
    <tradee_team_key>${tradeeTeamKey}</tradee_team_key>
${tradeNoteXML}    <players>
${playersXML}
    </players>
  </transaction>
</fantasy_content>`;
  }

  /**
   * Build XML for accepting a trade
   */
  private buildAcceptTradeXML(transactionKey: string, tradeNote?: string): string {
    const tradeNoteXML = tradeNote ? `    <trade_note>${tradeNote}</trade_note>\n` : '';
    
    return `<?xml version='1.0'?>
<fantasy_content>
  <transaction>
    <transaction_key>${transactionKey}</transaction_key>
    <type>pending_trade</type>
    <action>accept</action>
${tradeNoteXML}  </transaction>
</fantasy_content>`;
  }

  /**
   * Build XML for rejecting a trade
   */
  private buildRejectTradeXML(transactionKey: string, tradeNote?: string): string {
    const tradeNoteXML = tradeNote ? `    <trade_note>${tradeNote}</trade_note>\n` : '';
    
    return `<?xml version='1.0'?>
<fantasy_content>
  <transaction>
    <transaction_key>${transactionKey}</transaction_key>
    <type>pending_trade</type>
    <action>reject</action>
${tradeNoteXML}  </transaction>
</fantasy_content>`;
  }

  /**
   * Build XML for canceling a trade
   */
  private buildCancelTradeXML(transactionKey: string): string {
    return `<?xml version='1.0'?>
<fantasy_content>
  <transaction>
    <transaction_key>${transactionKey}</transaction_key>
    <type>pending_trade</type>
    <action>cancel</action>
  </transaction>
</fantasy_content>`;
  }

  /**
   * Build XML for voting on a trade
   */
  private buildVoteTradeXML(transactionKey: string, vote: 'allow' | 'veto'): string {
    return `<?xml version='1.0'?>
<fantasy_content>
  <transaction>
    <transaction_key>${transactionKey}</transaction_key>
    <type>pending_trade</type>
    <action>vote</action>
    <vote>${vote}</vote>
  </transaction>
</fantasy_content>`;
  }

  /**
   * Build XML for canceling a waiver claim
   */
  private buildCancelWaiverXML(transactionKey: string): string {
    return `<?xml version='1.0'?>
<fantasy_content>
  <transaction>
    <transaction_key>${transactionKey}</transaction_key>
    <type>waiver</type>
    <action>cancel</action>
  </transaction>
</fantasy_content>`;
  }

  /**
   * Build XML for editing a waiver claim
   */
  private buildEditWaiverXML(transactionKey: string, faabBid: number, priority?: number): string {
    const priorityXML = priority !== undefined ? `    <priority>${priority}</priority>` : '';
    
    return `<?xml version='1.0'?>
<fantasy_content>
  <transaction>
    <transaction_key>${transactionKey}</transaction_key>
    <type>waiver</type>
    <action>edit</action>
    <faab_bid>${faabBid}</faab_bid>${priorityXML ? '\n' + priorityXML : ''}
  </transaction>
</fantasy_content>`;
  }

  /**
   * Build XML for editing league settings (commissioner only)
   */
  private buildEditLeagueSettingsXML(settings: { [key: string]: string | undefined }): string {
    const settingsXML = Object.entries(settings)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        // Convert camelCase to snake_case for Yahoo API
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        return `    <${snakeKey}>${value}</${snakeKey}>`;
      })
      .join('\n');

    return `<?xml version='1.0'?>
<fantasy_content>
  <league>
    <league_key>${settings.leagueKey}</league_key>
    <settings>
${settingsXML}
    </settings>
  </league>
</fantasy_content>`;
  }

  /**
   * Build XML for managing roster (commissioner only)
   */
  private buildManageRosterXML(
    action: 'add' | 'drop' | 'add_drop',
    teamKey: string,
    players: { addPlayerKey?: string; dropPlayerKey?: string }
  ): string {
    if (action === 'add' && players.addPlayerKey) {
      return `<?xml version='1.0'?>
<fantasy_content>
  <transaction>
    <type>add</type>
    <is_commissioner_action>1</is_commissioner_action>
    <player>
      <player_key>${players.addPlayerKey}</player_key>
      <transaction_data>
        <type>add</type>
        <destination_team_key>${teamKey}</destination_team_key>
      </transaction_data>
    </player>
  </transaction>
</fantasy_content>`;
    } else if (action === 'drop' && players.dropPlayerKey) {
      return `<?xml version='1.0'?>
<fantasy_content>
  <transaction>
    <type>drop</type>
    <is_commissioner_action>1</is_commissioner_action>
    <player>
      <player_key>${players.dropPlayerKey}</player_key>
      <transaction_data>
        <type>drop</type>
        <source_team_key>${teamKey}</source_team_key>
      </transaction_data>
    </player>
  </transaction>
</fantasy_content>`;
    } else if (action === 'add_drop' && players.addPlayerKey && players.dropPlayerKey) {
      return `<?xml version='1.0'?>
<fantasy_content>
  <transaction>
    <type>add/drop</type>
    <is_commissioner_action>1</is_commissioner_action>
    <players>
      <player>
        <player_key>${players.addPlayerKey}</player_key>
        <transaction_data>
          <type>add</type>
          <destination_team_key>${teamKey}</destination_team_key>
        </transaction_data>
      </player>
      <player>
        <player_key>${players.dropPlayerKey}</player_key>
        <transaction_data>
          <type>drop</type>
          <source_team_key>${teamKey}</source_team_key>
        </transaction_data>
      </player>
    </players>
  </transaction>
</fantasy_content>`;
    }
    throw new Error(`Invalid action or missing player keys for ${action}`);
  }

  /**
   * Build XML for processing transactions (commissioner only)
   */
  private buildProcessTransactionXML(transactionKey: string, action: 'approve' | 'reject', note?: string): string {
    const noteXML = note ? `    <note>${note}</note>\n` : '';
    
    return `<?xml version='1.0'?>
<fantasy_content>
  <transaction>
    <transaction_key>${transactionKey}</transaction_key>
    <action>${action}</action>
    <is_commissioner_action>1</is_commissioner_action>
${noteXML}  </transaction>
</fantasy_content>`;
  }

  private getDefaultRosterDate(): string {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() + 1);
    return now.toISOString().split('T')[0];
  }

  /**
   * Build XML for editing team roster
   */
  private buildEditTeamRosterXML(
    teamKey: string,
    playerChanges: Array<{ playerKey: string; position: string }>,
    options?: {
      date?: string;
      week?: string | number;
      coverageType?: 'date' | 'week';
      isCommissionerAction?: boolean;
    }
  ): string {
    const coverageType = options?.coverageType ?? (options?.week !== undefined ? 'week' : 'date');

    let coverageValue: string;
    if (coverageType === 'week') {
      if (options?.week === undefined) {
        throw new Error('Week must be provided when coverage type is "week"');
      }
      coverageValue = String(options.week);
    } else {
      const targetDate = options?.date ?? this.getDefaultRosterDate();
      coverageValue = targetDate;
    }

    const coverageValueXML =
      coverageType === 'week'
        ? `    <week>${coverageValue}</week>`
        : `    <date>${coverageValue}</date>`;

    // Only include is_commissioner_action if explicitly set to true
    const commissionerActionXML = options?.isCommissionerAction === true
      ? `    <is_commissioner_action>1</is_commissioner_action>\n`
      : '';

    const playersXML = playerChanges.map(change => `      <player>
        <player_key>${change.playerKey}</player_key>
        <position>${change.position}</position>
      </player>`).join('\n');

    return `<?xml version='1.0'?>
<fantasy_content>
  <roster>
    <coverage_type>${coverageType}</coverage_type>
${coverageValueXML}
${commissionerActionXML}    <players>
${playersXML}
    </players>
  </roster>
</fantasy_content>`;
  }
}
