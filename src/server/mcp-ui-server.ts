import { createUIResource } from '@mcp-ui/server';
import { FantasyTools } from '../tools/fantasy-tools.js';
import { OAuthCredentials } from '../types/index.js';

// Enhanced helper function to create MCP-UI compliant components
function createPostMessageUI(uri: `ui://${string}`, title: string, formFields: string, actionName: string, description?: string, enableAppsSdk: boolean = false): any {
  console.error('[MCP-UI] Creating UI resource for:', uri, 'Apps SDK enabled:', enableAppsSdk);
  const result = createUIResource({
    uri,
    content: {
      type: 'rawHtml',
      htmlString: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: #f8fafc;
              color: #1a202c;
              line-height: 1.6;
            }
            
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 24px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              border: 1px solid #e2e8f0;
            }
            
            .header {
              margin-bottom: 24px;
              padding-bottom: 16px;
              border-bottom: 2px solid #e2e8f0;
            }
            
            .title {
              font-size: 24px;
              font-weight: 700;
              color: #1a202c;
              margin-bottom: 8px;
            }
            
            .description {
              color: #64748b;
              font-size: 14px;
            }
            
            .form-section {
              margin-bottom: 24px;
            }
            
            .form-group {
              margin-bottom: 16px;
            }
            
            .form-label {
              display: block;
              font-weight: 600;
              color: #374151;
              margin-bottom: 6px;
              font-size: 14px;
            }
            
            .form-input, .form-select {
              width: 100%;
              padding: 12px 16px;
              border: 2px solid #e2e8f0;
              border-radius: 8px;
              font-size: 14px;
              transition: all 0.2s ease;
              background: white;
            }
            
            .form-input:focus, .form-select:focus {
              outline: none;
              border-color: #667eea;
              box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            
            .form-input::placeholder {
              color: #9ca3af;
            }
            
            .btn {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
            }
            
            .btn:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
            }
            
            .btn:active {
              transform: translateY(0);
            }
            
            .btn:disabled {
              opacity: 0.6;
              cursor: not-allowed;
              transform: none;
            }
            
            .results {
              margin-top: 24px;
              padding: 20px;
              background: #f8fafc;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              display: none;
            }
            
            .loading {
              text-align: center;
              color: #667eea;
              font-style: italic;
              padding: 20px;
            }
            
            .error {
              color: #dc2626;
              background: #fef2f2;
              border: 1px solid #fecaca;
              padding: 12px 16px;
              border-radius: 6px;
              margin-top: 12px;
            }
            
            .success {
              color: #059669;
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              padding: 12px 16px;
              border-radius: 6px;
              margin-top: 12px;
            }
            
            .result-content {
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 16px;
              max-height: 400px;
              overflow-y: auto;
            }
            
            .result-content pre {
              margin: 0;
              white-space: pre-wrap;
              word-wrap: break-word;
              font-size: 12px;
              font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
              color: #374151;
            }
            
            @media (max-width: 640px) {
              .container {
                margin: 0;
                border-radius: 0;
                padding: 16px;
              }
              
              .title {
                font-size: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">${title}</h1>
              ${description ? `<p class="description">${description}</p>` : ''}
            </div>
            
            <div class="form-section">
              ${formFields}
            </div>
            
            <button class="btn" onclick="executeAction()" id="executeBtn">
              Execute
            </button>
            
            <div id="results" class="results">
              <div class="loading">Processing your request...</div>
            </div>
          </div>
          
          <script>
            let isExecuting = false;
            
            async function executeAction() {
              if (isExecuting) return;
              
              const resultsDiv = document.getElementById('results');
              const executeBtn = document.getElementById('executeBtn');
              
              try {
                isExecuting = true;
                executeBtn.disabled = true;
                executeBtn.textContent = 'Executing...';
                resultsDiv.style.display = 'block';
                resultsDiv.innerHTML = '<div class="loading">Processing your request...</div>';
                
                const requestId = Date.now().toString();
                const params = getFormData();
                
                // Validate required fields
                const validation = validateForm(params);
                if (!validation.valid) {
                  throw new Error(validation.message);
                }
                
                // Send message to parent window
                window.parent.postMessage({
                  type: 'tool',
                  requestId: requestId,
                  messageId: requestId,
                  payload: {
                    toolName: '${actionName}',
                    params: params
                  }
                }, window.location.origin);
                
                // Set up response handler
                const handleResponse = (event) => {
                  if (event.origin !== window.location.origin) return;
                  
                  if (event.data.type === 'ui-message-response' && event.data.messageId === requestId) {
                    if (event.data.payload.response) {
                      displayResult(event.data.payload.response);
                    } else if (event.data.payload.error) {
                      displayError(event.data.payload.error);
                    }
                    cleanup();
                  } else if (event.data.type === 'toolResult' && event.data.requestId === requestId) {
                    // Backward compatibility
                    displayResult(event.data.result);
                    cleanup();
                  } else if (event.data.type === 'toolError' && event.data.requestId === requestId) {
                    // Backward compatibility
                    displayError(event.data.error);
                    cleanup();
                  }
                };
                
                window.addEventListener('message', handleResponse);
                
                // Timeout handler
                const timeout = setTimeout(() => {
                  cleanup();
                  displayError('Request timed out after 30 seconds');
                }, 30000);
                
                function cleanup() {
                  window.removeEventListener('message', handleResponse);
                  clearTimeout(timeout);
                  isExecuting = false;
                  executeBtn.disabled = false;
                  executeBtn.textContent = 'Execute';
                }
                
              } catch (error) {
                displayError(error.message);
                isExecuting = false;
                executeBtn.disabled = false;
                executeBtn.textContent = 'Execute';
              }
            }
            
            function validateForm(params) {
              // Basic validation - can be extended per tool
              const requiredFields = ['${actionName}'.includes('league') ? 'league_key' : 'team_key'];
              
              for (const field of requiredFields) {
                if (!params[field] || params[field].trim() === '') {
                  return {
                    valid: false,
                    message: \`Please provide a valid \${field.replace('_', ' ')}\`
                  };
                }
              }
              
              return { valid: true };
            }
            
            function displayResult(result) {
              const resultsDiv = document.getElementById('results');
              resultsDiv.innerHTML = \`
                <div class="success">✅ Request completed successfully</div>
                <div class="result-content">
                  <pre>\${JSON.stringify(result, null, 2)}</pre>
                </div>
              \`;
            }
            
            function displayError(error) {
              const resultsDiv = document.getElementById('results');
              resultsDiv.innerHTML = \`
                <div class="error">❌ Error: \${error}</div>
              \`;
            }
            
            function getFormData() {
              const inputs = document.querySelectorAll('input, select');
              const params = {};
              inputs.forEach(input => {
                if (input.value && input.value.trim() !== '') {
                  params[input.id] = input.value.trim();
                }
              });
              return params;
            }
            
            // Auto-resize iframe to fit content
            function resizeIframe() {
              const height = Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight
              );
              
              window.parent.postMessage({
                type: 'resize',
                height: height
              }, window.location.origin);
            }
            
            // Resize on load and when content changes
            window.addEventListener('load', resizeIframe);
            window.addEventListener('resize', resizeIframe);
            
            // Auto-execution with execution guard
            let isExecuting = false;
            let hasExecuted = false;
            
            function startAutoExecution() {
              if (hasExecuted) return;
              
              // Try immediate execution
              setTimeout(() => {
                if (!hasExecuted && !isExecuting) {
                  executeAction();
                  hasExecuted = true;
                }
              }, 100);
            }
            
            // Start auto-execution when DOM is ready
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', startAutoExecution);
            } else {
              startAutoExecution();
            }
            
            // Initial resize
            setTimeout(resizeIframe, 100);
          </script>
        </body>
        </html>
      `
    },
    encoding: 'text',
    adapters: enableAppsSdk ? {
      appsSdk: {
        enabled: true,
        config: { intentHandling: 'prompt' }
      }
    } : undefined,
    metadata: {
      title: title,
      description: description || title,
      author: 'Yahoo Fantasy MCP',
      created: new Date().toISOString(),
      'mcp-ui': {
        preferredFrameSize: {
          width: 600,
          height: 400
        },
        initialRenderData: {
          actionName: actionName
        }
      },
      'openai/widgetDescription': description || title,
      'openai/widgetPrefersBorder': true,
      'openai/widgetAccessible': true,
      'openai/widgetCSP': {
        connect_domains: [],
        resource_domains: []
      }
    }
  });
  
  console.error('[MCP-UI] createUIResource result:', JSON.stringify(result, null, 2));
  return result;
}

export class YahooFantasyMcpUIServer {
  private fantasyTools: FantasyTools;
  private credentials: OAuthCredentials;

  constructor(credentials: OAuthCredentials, tokenSaveCallback?: (credentials: OAuthCredentials) => Promise<void>) {
    this.credentials = credentials;
    this.fantasyTools = new FantasyTools(credentials, tokenSaveCallback);
  }

  /**
   * Create UI resources for fantasy sports tools
   */
  createFantasyUIResources() {
    return [
      // League Standings UI
      this.createLeagueStandingsUI(),
      
      // Team Roster UI
      this.createTeamRosterUI(),
      
      // Free Agents UI
      this.createFreeAgentsUI(),
      
      // Lineup Optimization UI
      this.createLineupOptimizationUI(),
      
      // Player Search UI
      this.createPlayerSearchUI(),
      
      // Matchup UI
      this.createMatchupUI(),
    ];
  }

  /**
   * Create Apps SDK templates for OpenAI ChatGPT integration
   */
  createAppsSDKTemplates() {
    return [
      // League Standings Template
      this.createLeagueStandingsAppsSDKTemplate(),
      
      // Team Roster Template
      this.createTeamRosterAppsSDKTemplate(),
      
      // Free Agents Template
      this.createFreeAgentsAppsSDKTemplate(),
      
      // Lineup Optimization Template
      this.createLineupOptimizationAppsSDKTemplate(),
      
      // Player Search Template
      this.createPlayerSearchAppsSDKTemplate(),
      
      // Matchup Template
      this.createMatchupAppsSDKTemplate(),
    ];
  }

  private createLeagueStandingsUI() {
    const formFields = `
      <div class="form-group">
        <label for="league_key" class="form-label">League Key:</label>
        <input type="text" id="league_key" class="form-input" placeholder="e.g., 414.l.123456">
      </div>
    `;
    
    const resource = createPostMessageUI(
      'ui://league-standings',
      '📊 League Standings',
      formFields,
      'get_league_standings',
      'View current standings and team rankings for your fantasy league.'
    );
    
    console.error('[MCP-UI] League Standings resource structure:', JSON.stringify(resource, null, 2));
    return resource;
  }

  private createTeamRosterUI() {
    const formFields = `
      <div class="form-group">
        <label for="team_key" class="form-label">Team Key:</label>
        <input type="text" id="team_key" class="form-input" placeholder="e.g., 414.l.123456.t.1">
      </div>
    `;
    
    return createPostMessageUI(
      'ui://team-roster',
      '👥 Team Roster',
      formFields,
      'get_team_roster',
      'View detailed roster information including player positions, stats, and availability.'
    );
  }

  private createFreeAgentsUI() {
    const formFields = `
      <div class="form-group">
        <label for="league_key" class="form-label">League Key:</label>
        <input type="text" id="league_key" class="form-input" placeholder="e.g., 414.l.123456">
      </div>
      <div class="form-group">
        <label for="position" class="form-label">Position Filter:</label>
        <select id="position" class="form-select">
          <option value="">All Positions</option>
          <option value="C">Catcher</option>
          <option value="1B">First Base</option>
          <option value="2B">Second Base</option>
          <option value="SS">Shortstop</option>
          <option value="3B">Third Base</option>
          <option value="OF">Outfield</option>
          <option value="SP">Starting Pitcher</option>
          <option value="RP">Relief Pitcher</option>
          <option value="P">Pitcher</option>
        </select>
      </div>
    `;
    
    return createPostMessageUI(
      'ui://free-agents',
      '🆓 Free Agents',
      formFields,
      'get_free_agents',
      'Browse available free agents in your league with optional position filtering.'
    );
  }

  private createLineupOptimizationUI() {
    const formFields = `
      <div class="form-group">
        <label for="team_key" class="form-label">Team Key:</label>
        <input type="text" id="team_key" class="form-input" placeholder="e.g., 414.l.123456.t.1">
      </div>
      <div class="form-group">
        <label for="optimization_type" class="form-label">Optimization Type:</label>
        <select id="optimization_type" class="form-select">
          <option value="projected">Projected Points</option>
          <option value="recent">Recent Performance</option>
          <option value="season">Season Averages</option>
        </select>
      </div>
    `;
    
    return createPostMessageUI(
      'ui://lineup-optimization',
      '⚡ Lineup Optimization',
      formFields,
      'get_lineup_optimization',
      'Get AI-powered lineup recommendations based on projected points, recent performance, or season averages.'
    );
  }

  private createPlayerSearchUI() {
    const formFields = `
      <div class="form-group">
        <label for="league_key" class="form-label">League Key:</label>
        <input type="text" id="league_key" class="form-input" placeholder="e.g., 414.l.123456">
      </div>
      <div class="form-group">
        <label for="name" class="form-label">Player Name:</label>
        <input type="text" id="name" class="form-input" placeholder="e.g., Mike Trout">
      </div>
      <div class="form-group">
        <label for="position" class="form-label">Position:</label>
        <select id="position" class="form-select">
          <option value="">All Positions</option>
          <option value="C">Catcher</option>
          <option value="1B">First Base</option>
          <option value="2B">Second Base</option>
          <option value="SS">Shortstop</option>
          <option value="3B">Third Base</option>
          <option value="OF">Outfield</option>
          <option value="SP">Starting Pitcher</option>
          <option value="RP">Relief Pitcher</option>
          <option value="P">Pitcher</option>
        </select>
      </div>
    `;
    
    return createPostMessageUI(
      'ui://player-search',
      '🔍 Player Search',
      formFields,
      'search_players',
      'Search for specific players in your league with advanced filtering options.'
    );
  }

  private createMatchupUI() {
    const formFields = `
      <div class="form-group">
        <label for="team_key" class="form-label">Team Key:</label>
        <input type="text" id="team_key" class="form-input" placeholder="e.g., 414.l.123456.t.1">
      </div>
      <div class="form-group">
        <label for="week" class="form-label">Week (optional):</label>
        <input type="number" id="week" class="form-input" placeholder="e.g., 1" min="1" max="26">
      </div>
    `;
    
    return createPostMessageUI(
      'ui://matchup',
      '⚔️ Team Matchup',
      formFields,
      'get_team_matchup',
      'View current or historical matchup information for your team.'
    );
  }

  /**
   * Update credentials
   */
  updateCredentials(credentials: Partial<OAuthCredentials>): void {
    this.credentials = { ...this.credentials, ...credentials };
    this.fantasyTools.updateCredentials(credentials);
  }

  /**
   * Get fantasy tools instance
   */
  getFantasyTools(): FantasyTools {
    return this.fantasyTools;
  }

  // Apps SDK Template Methods
  private createLeagueStandingsAppsSDKTemplate() {
    const formFields = `
      <div class="form-group">
        <label for="league_key" class="form-label">League Key:</label>
        <input type="text" id="league_key" class="form-input" placeholder="e.g., 414.l.123456">
      </div>
    `;

    return createPostMessageUI(
      'ui://templates/league-standings',
      '📊 League Standings',
      formFields,
      'get_league_standings',
      'View current standings and team rankings for your fantasy league.',
      true // Enable Apps SDK
    );
  }

  private createTeamRosterAppsSDKTemplate() {
    const formFields = `
      <div class="form-group">
        <label for="team_key" class="form-label">Team Key:</label>
        <input type="text" id="team_key" class="form-input" placeholder="e.g., 414.l.123456.t.1">
      </div>
    `;

    return createPostMessageUI(
      'ui://templates/team-roster',
      '👥 Team Roster',
      formFields,
      'get_team_roster',
      'View detailed roster information including player positions, stats, and availability.',
      true // Enable Apps SDK
    );
  }

  private createFreeAgentsAppsSDKTemplate() {
    const formFields = `
      <div class="form-group">
        <label for="league_key" class="form-label">League Key:</label>
        <input type="text" id="league_key" class="form-input" placeholder="e.g., 414.l.123456">
      </div>
      <div class="form-group">
        <label for="position" class="form-label">Position Filter:</label>
        <select id="position" class="form-select">
          <option value="">All Positions</option>
          <option value="C">Catcher</option>
          <option value="1B">First Base</option>
          <option value="2B">Second Base</option>
          <option value="SS">Shortstop</option>
          <option value="3B">Third Base</option>
          <option value="OF">Outfield</option>
          <option value="SP">Starting Pitcher</option>
          <option value="RP">Relief Pitcher</option>
          <option value="P">Pitcher</option>
        </select>
      </div>
    `;

    return createPostMessageUI(
      'ui://templates/free-agents',
      '🆓 Free Agents',
      formFields,
      'get_free_agents',
      'Browse available free agents in your league with optional position filtering.',
      true // Enable Apps SDK
    );
  }

  private createLineupOptimizationAppsSDKTemplate() {
    const formFields = `
      <div class="form-group">
        <label for="team_key" class="form-label">Team Key:</label>
        <input type="text" id="team_key" class="form-input" placeholder="e.g., 414.l.123456.t.1">
      </div>
      <div class="form-group">
        <label for="optimization_type" class="form-label">Optimization Type:</label>
        <select id="optimization_type" class="form-select">
          <option value="projected">Projected Points</option>
          <option value="recent">Recent Performance</option>
          <option value="season">Season Averages</option>
        </select>
      </div>
    `;

    return createPostMessageUI(
      'ui://templates/lineup-optimization',
      '⚡ Lineup Optimization',
      formFields,
      'get_lineup_optimization',
      'Get AI-powered lineup recommendations based on projected points, recent performance, or season averages.',
      true // Enable Apps SDK
    );
  }

  private createPlayerSearchAppsSDKTemplate() {
    const formFields = `
      <div class="form-group">
        <label for="league_key" class="form-label">League Key:</label>
        <input type="text" id="league_key" class="form-input" placeholder="e.g., 414.l.123456">
      </div>
      <div class="form-group">
        <label for="name" class="form-label">Player Name:</label>
        <input type="text" id="name" class="form-input" placeholder="e.g., Mike Trout">
      </div>
      <div class="form-group">
        <label for="position" class="form-label">Position Filter:</label>
        <select id="position" class="form-select">
          <option value="">All Positions</option>
          <option value="C">Catcher</option>
          <option value="1B">First Base</option>
          <option value="2B">Second Base</option>
          <option value="SS">Shortstop</option>
          <option value="3B">Third Base</option>
          <option value="OF">Outfield</option>
          <option value="SP">Starting Pitcher</option>
          <option value="RP">Relief Pitcher</option>
          <option value="P">Pitcher</option>
        </select>
      </div>
    `;

    return createPostMessageUI(
      'ui://templates/player-search',
      '🔍 Player Search',
      formFields,
      'search_players',
      'Search for specific players in your league with advanced filtering options.',
      true // Enable Apps SDK
    );
  }

  private createMatchupAppsSDKTemplate() {
    const formFields = `
      <div class="form-group">
        <label for="team_key" class="form-label">Team Key:</label>
        <input type="text" id="team_key" class="form-input" placeholder="e.g., 414.l.123456.t.1">
      </div>
      <div class="form-group">
        <label for="week" class="form-label">Week (optional):</label>
        <input type="number" id="week" class="form-input" placeholder="e.g., 1">
      </div>
    `;

    return createPostMessageUI(
      'ui://templates/matchup',
      '⚔️ Team Matchup',
      formFields,
      'get_team_matchup',
      'View current and historical matchups for your fantasy team.',
      true // Enable Apps SDK
    );
  }
}