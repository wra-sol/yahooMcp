import { createUIResource } from '@mcp-ui/server';
import { FantasyTools } from '../tools/fantasy-tools.js';
import { OAuthCredentials } from '../types/index.js';

// Helper function to create postMessage-based UI components
function createPostMessageUI(uri: `ui://${string}`, title: string, formFields: string, actionName: string): any {
  return createUIResource({
    uri,
    content: {
      type: 'rawHtml',
      htmlString: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #333; margin-bottom: 20px;">${title}</h2>
          <div style="margin-bottom: 15px;">
            ${formFields}
          </div>
          <button onclick="executeAction()" 
                  style="background-color: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">
            Execute
          </button>
          <div id="results" style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; display: none;">
          </div>
        </div>
        <script>
          async function executeAction() {
            const resultsDiv = document.getElementById('results');
            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = '<div style="text-align: center; color: #666; font-style: italic;">Loading...</div>';
            
            try {
              const requestId = Date.now().toString();
              const params = getFormData();
              
              window.parent.postMessage({
                type: 'tool',
                requestId: requestId,
                messageId: requestId, // Add messageId for new format
                payload: {
                  toolName: '${actionName}',
                  params: params
                }
              }, window.location.origin);
              
              // Listen for response
              const handleResponse = (event) => {
                if (event.data.type === 'ui-message-response' && event.data.messageId === requestId) {
                  if (event.data.payload.response) {
                    resultsDiv.innerHTML = '<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; font-size: 12px;">' + JSON.stringify(event.data.payload.response, null, 2) + '</pre>';
                  } else if (event.data.payload.error) {
                    resultsDiv.innerHTML = '<div style="color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px;">Error: ' + event.data.payload.error + '</div>';
                  }
                  window.removeEventListener('message', handleResponse);
                } else if (event.data.type === 'toolResult' && event.data.requestId === requestId) {
                  // Backward compatibility
                  resultsDiv.innerHTML = '<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; font-size: 12px;">' + JSON.stringify(event.data.result, null, 2) + '</pre>';
                  window.removeEventListener('message', handleResponse);
                } else if (event.data.type === 'toolError' && event.data.requestId === requestId) {
                  // Backward compatibility
                  resultsDiv.innerHTML = '<div style="color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px;">Error: ' + event.data.error + '</div>';
                  window.removeEventListener('message', handleResponse);
                }
              };
              
              window.addEventListener('message', handleResponse);
              
              // Timeout after 30 seconds
              setTimeout(() => {
                window.removeEventListener('message', handleResponse);
                if (resultsDiv.innerHTML.includes('Loading...')) {
                  resultsDiv.innerHTML = '<div style="color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px;">Request timed out</div>';
                }
              }, 30000);
              
            } catch (error) {
              resultsDiv.innerHTML = '<div style="color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px;">Error: ' + error.message + '</div>';
            }
          }
          
          function getFormData() {
            const inputs = document.querySelectorAll('input, select');
            const params = {};
            inputs.forEach(input => {
              if (input.value) {
                params[input.id] = input.value;
              }
            });
            return params;
          }
        </script>
      `
    },
    encoding: 'text'
  });
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

  private createLeagueStandingsUI() {
    const formFields = `
      <label for="league_key" style="display: block; margin-bottom: 5px; font-weight: 500;">League Key:</label>
      <input type="text" id="league_key" placeholder="e.g., 414.l.123456" 
             style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
    `;
    
    return createPostMessageUI(
      'ui://league-standings',
      '📊 League Standings',
      formFields,
      'get_league_standings'
    );
  }

  private createTeamRosterUI() {
    const formFields = `
      <label for="team_key" style="display: block; margin-bottom: 5px; font-weight: 500;">Team Key:</label>
      <input type="text" id="team_key" placeholder="e.g., 414.l.123456.t.1" 
             style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
    `;
    
    return createPostMessageUI(
      'ui://team-roster',
      '👥 Team Roster',
      formFields,
      'get_team_roster'
    );
  }

  private createFreeAgentsUI() {
    const formFields = `
      <label for="league_key" style="display: block; margin-bottom: 5px; font-weight: 500;">League Key:</label>
      <input type="text" id="league_key" placeholder="e.g., 414.l.123456" 
             style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
      <label for="position" style="display: block; margin: 15px 0 5px; font-weight: 500;">Position Filter:</label>
      <select id="position" style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
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
    `;
    
    return createPostMessageUI(
      'ui://free-agents',
      '🆓 Free Agents',
      formFields,
      'get_free_agents'
    );
  }

  private createLineupOptimizationUI() {
    const formFields = `
      <label for="team_key" style="display: block; margin-bottom: 5px; font-weight: 500;">Team Key:</label>
      <input type="text" id="team_key" placeholder="e.g., 414.l.123456.t.1" 
             style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
      <label for="optimization_type" style="display: block; margin: 15px 0 5px; font-weight: 500;">Optimization Type:</label>
      <select id="optimization_type" style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
        <option value="projected">Projected Points</option>
        <option value="recent">Recent Performance</option>
        <option value="season">Season Averages</option>
      </select>
    `;
    
    return createPostMessageUI(
      'ui://lineup-optimization',
      '⚡ Lineup Optimization',
      formFields,
      'get_lineup_optimization'
    );
  }

  private createPlayerSearchUI() {
    const formFields = `
      <label for="league_key" style="display: block; margin-bottom: 5px; font-weight: 500;">League Key:</label>
      <input type="text" id="league_key" placeholder="e.g., 414.l.123456" 
             style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
      <label for="name" style="display: block; margin: 15px 0 5px; font-weight: 500;">Player Name:</label>
      <input type="text" id="name" placeholder="e.g., Mike Trout" 
             style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
      <label for="position" style="display: block; margin: 15px 0 5px; font-weight: 500;">Position:</label>
      <select id="position" style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
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
    `;
    
    return createPostMessageUI(
      'ui://player-search',
      '🔍 Player Search',
      formFields,
      'search_players'
    );
  }

  private createMatchupUI() {
    const formFields = `
      <label for="team_key" style="display: block; margin-bottom: 5px; font-weight: 500;">Team Key:</label>
      <input type="text" id="team_key" placeholder="e.g., 414.l.123456.t.1" 
             style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
      <label for="week" style="display: block; margin: 15px 0 5px; font-weight: 500;">Week (optional):</label>
      <input type="number" id="week" placeholder="e.g., 1" 
             style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
    `;
    
    return createPostMessageUI(
      'ui://matchup',
      '⚔️ Team Matchup',
      formFields,
      'get_team_matchup'
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
}