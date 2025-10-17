import { createUIResource } from '@mcp-ui/server';
import { FantasyTools } from '../tools/fantasy-tools.js';
import { OAuthCredentials } from '../types/index.js';

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
    return createUIResource({
      uri: 'ui://league-standings',
      content: {
        type: 'rawHtml',
        htmlString: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px;">
            <h2 style="color: #333; margin-bottom: 20px;">📊 League Standings</h2>
            <div style="margin-bottom: 15px;">
              <label for="league-key" style="display: block; margin-bottom: 5px; font-weight: 500;">League Key:</label>
              <input type="text" id="league-key" placeholder="e.g., 414.l.123456" 
                     style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            <button onclick="getLeagueStandings()" 
                    style="background-color: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">
              Get Standings
            </button>
            <div id="standings-results" style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; display: none;">
            </div>
          </div>
          <script>
            async function getLeagueStandings() {
              const leagueKey = document.getElementById('league-key').value;
              if (!leagueKey) {
                alert('Please enter a league key');
                return;
              }
              
              const resultsDiv = document.getElementById('standings-results');
              resultsDiv.style.display = 'block';
              resultsDiv.innerHTML = '<div style="text-align: center; color: #666; font-style: italic;">Loading...</div>';
              
              try {
                const response = await fetch('/mcp-ui/action', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    action: 'get_league_standings', 
                    parameters: { league_key: leagueKey } 
                  })
                });
                
                if (!response.ok) throw new Error('Request failed');
                const result = await response.json();
                resultsDiv.innerHTML = '<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; font-size: 12px;">' + JSON.stringify(result, null, 2) + '</pre>';
              } catch (error) {
                resultsDiv.innerHTML = '<div style="color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px;">Error: ' + error.message + '</div>';
              }
            }
          </script>
        `
      },
      encoding: 'text'
    });
  }

  private createTeamRosterUI() {
    return createUIResource({
      uri: 'ui://team-roster',
      content: {
        type: 'rawHtml',
        htmlString: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px;">
            <h2 style="color: #333; margin-bottom: 20px;">👥 Team Roster</h2>
            <div style="margin-bottom: 15px;">
              <label for="team-key" style="display: block; margin-bottom: 5px; font-weight: 500;">Team Key:</label>
              <input type="text" id="team-key" placeholder="e.g., 414.l.123456.t.1" 
                     style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            <button onclick="getTeamRoster()" 
                    style="background-color: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">
              Get Roster
            </button>
            <div id="roster-results" style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; display: none;">
            </div>
          </div>
          <script>
            async function getTeamRoster() {
              const teamKey = document.getElementById('team-key').value;
              if (!teamKey) {
                alert('Please enter a team key');
                return;
              }
              
              const resultsDiv = document.getElementById('roster-results');
              resultsDiv.style.display = 'block';
              resultsDiv.innerHTML = '<div style="text-align: center; color: #666; font-style: italic;">Loading...</div>';
              
              try {
                const response = await fetch('/mcp-ui/action', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    action: 'get_team_roster', 
                    parameters: { team_key: teamKey } 
                  })
                });
                
                if (!response.ok) throw new Error('Request failed');
                const result = await response.json();
                resultsDiv.innerHTML = '<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; font-size: 12px;">' + JSON.stringify(result, null, 2) + '</pre>';
              } catch (error) {
                resultsDiv.innerHTML = '<div style="color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px;">Error: ' + error.message + '</div>';
              }
            }
          </script>
        `
      },
      encoding: 'text'
    });
  }

  private createFreeAgentsUI() {
    return createUIResource({
      uri: 'ui://free-agents',
      content: {
        type: 'rawHtml',
        htmlString: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px;">
            <h2 style="color: #333; margin-bottom: 20px;">🆓 Free Agents</h2>
            <div style="margin-bottom: 15px;">
              <label for="league-key-fa" style="display: block; margin-bottom: 5px; font-weight: 500;">League Key:</label>
              <input type="text" id="league-key-fa" placeholder="e.g., 414.l.123456" 
                     style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            <div style="margin-bottom: 15px;">
              <label for="position-filter" style="display: block; margin-bottom: 5px; font-weight: 500;">Position Filter:</label>
              <select id="position-filter" style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
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
            <button onclick="getFreeAgents()" 
                    style="background-color: #ffc107; color: #212529; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">
              Get Free Agents
            </button>
            <div id="free-agents-results" style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; display: none;">
            </div>
          </div>
          <script>
            async function getFreeAgents() {
              const leagueKey = document.getElementById('league-key-fa').value;
              const position = document.getElementById('position-filter').value;
              
              if (!leagueKey) {
                alert('Please enter a league key');
                return;
              }
              
              const resultsDiv = document.getElementById('free-agents-results');
              resultsDiv.style.display = 'block';
              resultsDiv.innerHTML = '<div style="text-align: center; color: #666; font-style: italic;">Loading...</div>';
              
              try {
                const parameters = { league_key: leagueKey };
                if (position) parameters.position = position;
                
                const response = await fetch('/mcp-ui/action', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    action: 'get_free_agents', 
                    parameters: parameters 
                  })
                });
                
                if (!response.ok) throw new Error('Request failed');
                const result = await response.json();
                resultsDiv.innerHTML = '<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; font-size: 12px;">' + JSON.stringify(result, null, 2) + '</pre>';
              } catch (error) {
                resultsDiv.innerHTML = '<div style="color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px;">Error: ' + error.message + '</div>';
              }
            }
          </script>
        `
      },
      encoding: 'text'
    });
  }

  private createLineupOptimizationUI() {
    return createUIResource({
      uri: 'ui://lineup-optimization',
      content: {
        type: 'rawHtml',
        htmlString: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px;">
            <h2 style="color: #333; margin-bottom: 20px;">⚡ Lineup Optimization</h2>
            <div style="margin-bottom: 15px;">
              <label for="team-key-opt" style="display: block; margin-bottom: 5px; font-weight: 500;">Team Key:</label>
              <input type="text" id="team-key-opt" placeholder="e.g., 414.l.123456.t.1" 
                     style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            <div style="margin-bottom: 15px;">
              <label for="optimization-type" style="display: block; margin-bottom: 5px; font-weight: 500;">Optimization Type:</label>
              <select id="optimization-type" style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                <option value="projected">Projected Points</option>
                <option value="recent">Recent Performance</option>
                <option value="season">Season Averages</option>
              </select>
            </div>
            <button onclick="optimizeLineup()" 
                    style="background-color: #17a2b8; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">
              Optimize Lineup
            </button>
            <div id="optimization-results" style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; display: none;">
            </div>
          </div>
          <script>
            async function optimizeLineup() {
              const teamKey = document.getElementById('team-key-opt').value;
              const optimizationType = document.getElementById('optimization-type').value;
              
              if (!teamKey) {
                alert('Please enter a team key');
                return;
              }
              
              const resultsDiv = document.getElementById('optimization-results');
              resultsDiv.style.display = 'block';
              resultsDiv.innerHTML = '<div style="text-align: center; color: #666; font-style: italic;">Loading...</div>';
              
              try {
                const response = await fetch('/mcp-ui/action', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    action: 'get_lineup_optimization', 
                    parameters: { 
                      team_key: teamKey,
                      optimization_type: optimizationType
                    } 
                  })
                });
                
                if (!response.ok) throw new Error('Request failed');
                const result = await response.json();
                resultsDiv.innerHTML = '<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; font-size: 12px;">' + JSON.stringify(result, null, 2) + '</pre>';
              } catch (error) {
                resultsDiv.innerHTML = '<div style="color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px;">Error: ' + error.message + '</div>';
              }
            }
          </script>
        `
      },
      encoding: 'text'
    });
  }

  private createPlayerSearchUI() {
    return createUIResource({
      uri: 'ui://player-search',
      content: {
        type: 'rawHtml',
        htmlString: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px;">
            <h2 style="color: #333; margin-bottom: 20px;">🔍 Player Search</h2>
            <div style="margin-bottom: 15px;">
              <label for="league-key-search" style="display: block; margin-bottom: 5px; font-weight: 500;">League Key:</label>
              <input type="text" id="league-key-search" placeholder="e.g., 414.l.123456" 
                     style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            <div style="margin-bottom: 15px;">
              <label for="player-name" style="display: block; margin-bottom: 5px; font-weight: 500;">Player Name:</label>
              <input type="text" id="player-name" placeholder="e.g., Mike Trout" 
                     style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            <div style="margin-bottom: 15px;">
              <label for="position-search" style="display: block; margin-bottom: 5px; font-weight: 500;">Position:</label>
              <select id="position-search" style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
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
            <button onclick="searchPlayers()" 
                    style="background-color: #6f42c1; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">
              Search Players
            </button>
            <div id="search-results" style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; display: none;">
            </div>
          </div>
          <script>
            async function searchPlayers() {
              const leagueKey = document.getElementById('league-key-search').value;
              const playerName = document.getElementById('player-name').value;
              const position = document.getElementById('position-search').value;
              
              if (!leagueKey) {
                alert('Please enter a league key');
                return;
              }
              
              const resultsDiv = document.getElementById('search-results');
              resultsDiv.style.display = 'block';
              resultsDiv.innerHTML = '<div style="text-align: center; color: #666; font-style: italic;">Loading...</div>';
              
              try {
                const parameters = { league_key: leagueKey };
                if (playerName) parameters.name = playerName;
                if (position) parameters.position = position;
                
                const response = await fetch('/mcp-ui/action', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    action: 'search_players', 
                    parameters: parameters 
                  })
                });
                
                if (!response.ok) throw new Error('Request failed');
                const result = await response.json();
                resultsDiv.innerHTML = '<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; font-size: 12px;">' + JSON.stringify(result, null, 2) + '</pre>';
              } catch (error) {
                resultsDiv.innerHTML = '<div style="color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px;">Error: ' + error.message + '</div>';
              }
            }
          </script>
        `
      },
      encoding: 'text'
    });
  }

  private createMatchupUI() {
    return createUIResource({
      uri: 'ui://matchup',
      content: {
        type: 'rawHtml',
        htmlString: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px;">
            <h2 style="color: #333; margin-bottom: 20px;">⚔️ Team Matchup</h2>
            <div style="margin-bottom: 15px;">
              <label for="team-key-matchup" style="display: block; margin-bottom: 5px; font-weight: 500;">Team Key:</label>
              <input type="text" id="team-key-matchup" placeholder="e.g., 414.l.123456.t.1" 
                     style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            <div style="margin-bottom: 15px;">
              <label for="week" style="display: block; margin-bottom: 5px; font-weight: 500;">Week (optional):</label>
              <input type="number" id="week" placeholder="e.g., 1" 
                     style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            <button onclick="getMatchup()" 
                    style="background-color: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">
              Get Matchup
            </button>
            <div id="matchup-results" style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; display: none;">
            </div>
          </div>
          <script>
            async function getMatchup() {
              const teamKey = document.getElementById('team-key-matchup').value;
              const week = document.getElementById('week').value;
              
              if (!teamKey) {
                alert('Please enter a team key');
                return;
              }
              
              const resultsDiv = document.getElementById('matchup-results');
              resultsDiv.style.display = 'block';
              resultsDiv.innerHTML = '<div style="text-align: center; color: #666; font-style: italic;">Loading...</div>';
              
              try {
                const parameters = { team_key: teamKey };
                if (week) parameters.week = parseInt(week);
                
                const response = await fetch('/mcp-ui/action', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    action: 'get_team_matchup', 
                    parameters: parameters 
                  })
                });
                
                if (!response.ok) throw new Error('Request failed');
                const result = await response.json();
                resultsDiv.innerHTML = '<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; font-size: 12px;">' + JSON.stringify(result, null, 2) + '</pre>';
              } catch (error) {
                resultsDiv.innerHTML = '<div style="color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px;">Error: ' + error.message + '</div>';
              }
            }
          </script>
        `
      },
      encoding: 'text'
    });
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