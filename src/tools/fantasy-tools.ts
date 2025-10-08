import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { YahooFantasyClient } from '../api/yahoo-fantasy-client.js';
import { OAuthCredentials } from '../types/index.js';

// Validation schemas
const OAuthCredentialsSchema = z.object({
  consumerKey: z.string(),
  consumerSecret: z.string(),
  accessToken: z.string().optional(),
  accessTokenSecret: z.string().optional(),
  sessionHandle: z.string().optional(),
});

const LeagueFiltersSchema = z.object({
  game_keys: z.array(z.string()).optional(),
  league_keys: z.array(z.string()).optional(),
  team_keys: z.array(z.string()).optional(),
  player_keys: z.array(z.string()).optional(),
  draft_results: z.boolean().optional(),
  draft_teams: z.boolean().optional(),
  players: z.boolean().optional(),
  stats: z.boolean().optional(),
  standings: z.boolean().optional(),
  rosters: z.boolean().optional(),
  matchups: z.boolean().optional(),
  scoreboard: z.boolean().optional(),
  transactions: z.boolean().optional(),
  settings: z.boolean().optional(),
  metadata: z.boolean().optional(),
});

const PlayerFiltersSchema = z.object({
  position: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  sort_type: z.string().optional(),
  sort_season: z.string().optional(),
  sort_week: z.string().optional(),
  count: z.number().min(1).max(25).optional(),
  start: z.number().min(0).optional(),
});

const TransactionFiltersSchema = z.object({
  type: z.string().optional(),
  types: z.array(z.string()).optional(),
  team_key: z.string().optional(),
  count: z.number().min(1).optional(),
});

export class FantasyTools {
  private client: YahooFantasyClient;

  constructor(credentials: OAuthCredentials, tokenSaveCallback?: (credentials: OAuthCredentials) => Promise<void>) {
    OAuthCredentialsSchema.parse(credentials);
    this.client = new YahooFantasyClient(credentials, tokenSaveCallback);
  }

  /**
   * Update OAuth credentials
   */
  updateCredentials(credentials: Partial<OAuthCredentials>): void {
    this.client.updateCredentials(credentials);
  }

  /**
   * Set token save callback
   */
  setTokenSaveCallback(callback: (credentials: OAuthCredentials) => Promise<void>): void {
    this.client.setTokenSaveCallback(callback);
  }

  /**
   * Get all available MCP tools
   */
  getTools(): Tool[] {
    return [
      this.getUserGamesTool(),
      this.getUserLeaguesTool(),
      this.getUserProfileTool(),
      this.getUserTeamsTool(),
      this.getLeagueHistoryTool(),
      this.getTeamHistoryTool(),
      this.getGameInfoTool(),
      this.getGameMetadataTool(),
      this.getGameStatCategoriesTool(),
      this.getLeagueTool(),
      this.getLeagueSettingsTool(),
      this.getLeagueMetadataTool(),
      this.getLeagueRostersTool(),
      this.getDraftResultsTool(),
      this.getDraftTeamsTool(),
      this.getDraftSettingsTool(),
      this.getLeagueStandingsTool(),
      this.getLeagueTeamsTool(),
      this.getLeagueScoreboardTool(),
      this.getMatchupDetailsTool(),
      this.getLeagueStatsTool(),
      this.getLiveScoresTool(),
      this.getGameUpdatesTool(),
      this.getLeagueTransactionsTool(),
      this.getLeaguePlayersTool(),
      this.getTeamTool(),
      this.getTeamRosterTool(),
      this.getTeamMatchupsTool(),
      this.getTeamTransactionsTool(),
      this.getPlayerTool(),
      this.getPlayerStatsTool(),
      this.getPlayerOwnershipTool(),
      this.getPlayerNotesTool(),
      this.searchPlayersTool(),
      this.searchPlayersByPositionTool(),
      this.getInjuredReserveTool(),
      this.getFreeAgentsTool(),
      this.getTeamStatsTool(),
      this.getTeamContextTool(),
      this.getWaiverClaimsTool(),
      this.addPlayerTool(),
      this.dropPlayerTool(),
      this.addDropPlayersTool(),
      this.proposeTradeTool(),
      this.acceptTradeTool(),
      this.rejectTradeTool(),
      this.cancelTradeTool(),
      this.voteOnTradeTool(),
      this.cancelWaiverClaimTool(),
      this.editWaiverClaimTool(),
      this.editLeagueSettingsTool(),
      this.manageRosterTool(),
      this.processTransactionTool(),
      this.editTeamRosterTool(),
    ];
  }

  private getUserGamesTool(): Tool {
    return {
      name: 'get_user_games',
      description: 'Get user\'s fantasy games (NFL, MLB, NBA, NHL)',
      inputSchema: {
        type: 'object',
        properties: {
          gameKeys: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional array of game keys to filter by (e.g., ["nfl", "mlb"])',
          },
        },
        additionalProperties: false,
      },
    };
  }

  private getUserLeaguesTool(): Tool {
    return {
      name: 'get_user_leagues',
      description: 'Get user\'s leagues for a specific game',
      inputSchema: {
        type: 'object',
        properties: {
          gameKey: {
            type: 'string',
            description: 'Game key (e.g., "nfl", "mlb", "nba", "nhl")',
          },
        },
        required: ['gameKey'],
        additionalProperties: false,
      },
    };
  }

  private getUserProfileTool(): Tool {
    return {
      name: 'get_user_profile',
      description: 'Get the current user\'s profile information',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    };
  }

  private getUserTeamsTool(): Tool {
    return {
      name: 'get_user_teams',
      description: 'Get all teams for the current user across games',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    };
  }

  private getLeagueHistoryTool(): Tool {
    return {
      name: 'get_league_history',
      description: 'Get historical league data including past seasons standings and results',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key for a past season (e.g., "390.l.123456" for 2019 NFL)',
          },
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getTeamHistoryTool(): Tool {
    return {
      name: 'get_team_history',
      description: 'Get historical team performance data including stats, standings, and matchups',
      inputSchema: {
        type: 'object',
        properties: {
          teamKey: {
            type: 'string',
            description: 'Team key for a past season (e.g., "390.l.123456.t.1")',
          },
        },
        required: ['teamKey'],
        additionalProperties: false,
      },
    };
  }

  private getGameInfoTool(): Tool {
    return {
      name: 'get_game_info',
      description: 'Get detailed game information',
      inputSchema: {
        type: 'object',
        properties: {
          gameKey: { type: 'string', description: 'Game key (e.g., "nfl", "mlb", "414")' },
        },
        required: ['gameKey'],
        additionalProperties: false,
      },
    };
  }

  private getGameMetadataTool(): Tool {
    return {
      name: 'get_game_metadata',
      description: 'Get game metadata and settings',
      inputSchema: {
        type: 'object',
        properties: {
          gameKey: { type: 'string', description: 'Game key (e.g., "nfl", "mlb", "414")' },
        },
        required: ['gameKey'],
        additionalProperties: false,
      },
    };
  }

  private getGameStatCategoriesTool(): Tool {
    return {
      name: 'get_game_stat_categories',
      description: 'Get stat categories for a game',
      inputSchema: {
        type: 'object',
        properties: {
          gameKey: { type: 'string', description: 'Game key (e.g., "nfl", "mlb", "414")' },
        },
        required: ['gameKey'],
        additionalProperties: false,
      },
    };
  }

  private getLeagueTool(): Tool {
    return {
      name: 'get_league',
      description: 'Get detailed information about a specific league',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          filters: LeagueFiltersSchema,
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getLeagueSettingsTool(): Tool {
    return {
      name: 'get_league_settings',
      description: 'Get detailed league settings and configuration',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getLeagueMetadataTool(): Tool {
    return {
      name: 'get_league_metadata',
      description: 'Get league metadata',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: { type: 'string', description: 'League key (e.g., "414.l.123456")' },
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getLeagueRostersTool(): Tool {
    return {
      name: 'get_league_rosters',
      description: 'Get roster information for all teams in a league',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: { type: 'string', description: 'League key (e.g., "414.l.123456")' },
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getDraftResultsTool(): Tool {
    return {
      name: 'get_draft_results',
      description: 'Get draft results for a league',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: { type: 'string', description: 'League key (e.g., "414.l.123456")' },
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getDraftTeamsTool(): Tool {
    return {
      name: 'get_draft_teams',
      description: 'Get draft team information for a league',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: { type: 'string', description: 'League key (e.g., "414.l.123456")' },
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getDraftSettingsTool(): Tool {
    return {
      name: 'get_draft_settings',
      description: 'Get draft settings and configuration for a league',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: { type: 'string', description: 'League key (e.g., "414.l.123456")' },
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getLeagueStandingsTool(): Tool {
    return {
      name: 'get_league_standings',
      description: 'Get league standings',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getLeagueTeamsTool(): Tool {
    return {
      name: 'get_league_teams',
      description: 'Get all teams in a league',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          filters: LeagueFiltersSchema,
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getLeagueScoreboardTool(): Tool {
    return {
      name: 'get_league_scoreboard',
      description: 'Get league scoreboard/matchups for current or specific week',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          week: {
            type: 'string',
            description: 'Optional week number (e.g., "1", "2")',
          },
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getMatchupDetailsTool(): Tool {
    return {
      name: 'get_matchup_details',
      description: 'Get detailed matchup information including team rosters, stats, and scoring details for a specific week',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          week: {
            type: 'string',
            description: 'Optional week number (e.g., "1", "2"). If not provided, returns current week matchups.',
          },
          teamKeys: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional array of team keys to filter specific matchups (e.g., ["414.l.123456.t.1", "414.l.123456.t.2"])',
          },
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getLeagueStatsTool(): Tool {
    return {
      name: 'get_league_stats',
      description: 'Get league-wide statistics aggregated across all teams',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getLiveScoresTool(): Tool {
    return {
      name: 'get_live_scores',
      description: 'Get live scoring updates for league matchups',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          week: {
            type: 'string',
            description: 'Optional week number (e.g., "1", "2"). If not provided, returns current week.',
          },
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getGameUpdatesTool(): Tool {
    return {
      name: 'get_game_updates',
      description: 'Get real-time game updates and current state',
      inputSchema: {
        type: 'object',
        properties: {
          gameKey: {
            type: 'string',
            description: 'Game key (e.g., "nfl", "mlb", "414")',
          },
        },
        required: ['gameKey'],
        additionalProperties: false,
      },
    };
  }

  private getLeagueTransactionsTool(): Tool {
    return {
      name: 'get_league_transactions',
      description: 'Get league transactions (trades, adds, drops)',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          filters: TransactionFiltersSchema,
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getLeaguePlayersTool(): Tool {
    return {
      name: 'get_league_players',
      description: 'Get all players in a league',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          filters: PlayerFiltersSchema,
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getTeamTool(): Tool {
    return {
      name: 'get_team',
      description: 'Get detailed information about a specific team',
      inputSchema: {
        type: 'object',
        properties: {
          teamKey: {
            type: 'string',
            description: 'Team key (e.g., "414.l.123456.t.1")',
          },
          filters: LeagueFiltersSchema,
        },
        required: ['teamKey'],
        additionalProperties: false,
      },
    };
  }

  private getTeamRosterTool(): Tool {
    return {
      name: 'get_team_roster',
      description: 'Get team roster for current or specific week',
      inputSchema: {
        type: 'object',
        properties: {
          teamKey: {
            type: 'string',
            description: 'Team key (e.g., "414.l.123456.t.1")',
          },
          week: {
            type: 'string',
            description: 'Optional week number (e.g., "1", "2")',
          },
        },
        required: ['teamKey'],
        additionalProperties: false,
      },
    };
  }

  private getTeamMatchupsTool(): Tool {
    return {
      name: 'get_team_matchups',
      description: 'Get team matchups for current or specific week',
      inputSchema: {
        type: 'object',
        properties: {
          teamKey: {
            type: 'string',
            description: 'Team key (e.g., "414.l.123456.t.1")',
          },
          week: {
            type: 'string',
            description: 'Optional week number (e.g., "1", "2")',
          },
        },
        required: ['teamKey'],
        additionalProperties: false,
      },
    };
  }

  private getTeamTransactionsTool(): Tool {
    return {
      name: 'get_team_transactions',
      description: 'Get team transactions (trades, adds, drops)',
      inputSchema: {
        type: 'object',
        properties: {
          teamKey: {
            type: 'string',
            description: 'Team key (e.g., "414.l.123456.t.1")',
          },
          filters: TransactionFiltersSchema,
        },
        required: ['teamKey'],
        additionalProperties: false,
      },
    };
  }

  private getPlayerTool(): Tool {
    return {
      name: 'get_player',
      description: 'Get detailed information about a specific player',
      inputSchema: {
        type: 'object',
        properties: {
          playerKey: {
            type: 'string',
            description: 'Player key (e.g., "414.p.12345")',
          },
        },
        required: ['playerKey'],
        additionalProperties: false,
      },
    };
  }

  private getPlayerStatsTool(): Tool {
    return {
      name: 'get_player_stats',
      description: 'Get player statistics for season, week, last week/month, or date',
      inputSchema: {
        type: 'object',
        properties: {
          playerKey: {
            type: 'string',
            description: 'Player key (e.g., "414.p.12345")',
          },
          statType: {
            type: 'string',
            description: 'Type of stats to retrieve',
            enum: ['season', 'lastweek', 'lastmonth', 'date', 'week'],
            default: 'season',
          },
          season: { type: 'string', description: 'Season year, e.g., "2024"' },
          week: { type: 'string', description: 'Week number for weekly stats' },
          date: { type: 'string', description: 'Date for daily stats (YYYY-MM-DD)' },
        },
        required: ['playerKey'],
        additionalProperties: false,
      },
    };
  }

  private getPlayerOwnershipTool(): Tool {
    return {
      name: 'get_player_ownership',
      description: 'Get player ownership information within a league',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: { type: 'string', description: 'League key (e.g., "414.l.123456")' },
          playerKey: { type: 'string', description: 'Player key (e.g., "414.p.12345")' },
        },
        required: ['leagueKey', 'playerKey'],
        additionalProperties: false,
      },
    };
  }

  private getPlayerNotesTool(): Tool {
    return {
      name: 'get_player_notes',
      description: "Get Yahoo's editorial notes and news for a player",
      inputSchema: {
        type: 'object',
        properties: {
          playerKey: { type: 'string', description: 'Player key (e.g., "414.p.12345")' },
        },
        required: ['playerKey'],
        additionalProperties: false,
      },
    };
  }

  private searchPlayersTool(): Tool {
    return {
      name: 'search_players',
      description: 'Search for players in a specific game',
      inputSchema: {
        type: 'object',
        properties: {
          gameKey: {
            type: 'string',
            description: 'Game key (e.g., "nfl", "mlb", "nba", "nhl")',
          },
          filters: PlayerFiltersSchema,
        },
        required: ['gameKey'],
        additionalProperties: false,
      },
    };
  }

  private searchPlayersByPositionTool(): Tool {
    return {
      name: 'search_players_by_position',
      description: 'Advanced player search by position within a league',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          position: {
            type: 'string',
            description: 'Position to filter by (e.g., "QB", "RB", "WR", "TE", "C", "1B", "SP", "RP")',
          },
          filters: PlayerFiltersSchema,
        },
        required: ['leagueKey', 'position'],
        additionalProperties: false,
      },
    };
  }

  private getInjuredReserveTool(): Tool {
    return {
      name: 'get_injured_reserve',
      description: 'Get players on injured reserve or with injury status for a team',
      inputSchema: {
        type: 'object',
        properties: {
          teamKey: {
            type: 'string',
            description: 'Team key (e.g., "414.l.123456.t.1")',
          },
        },
        required: ['teamKey'],
        additionalProperties: false,
      },
    };
  }

  private getFreeAgentsTool(): Tool {
    return {
      name: 'get_free_agents',
      description: 'Get available free agents in a league',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          position: {
            type: 'string',
            description: 'Optional position filter (e.g., "QB", "RB", "WR", "TE")',
          },
          status: {
            type: 'string',
            description: 'Player status filter (default: "A" for available)',
            default: 'A',
          },
          count: {
            type: 'number',
            description: 'Number of players to return (max 25)',
            minimum: 1,
            maximum: 25,
            default: 25,
          },
          start: {
            type: 'number',
            description: 'Starting index for pagination',
            minimum: 0,
            default: 0,
          },
        },
        required: ['leagueKey'],
        additionalProperties: false,
      },
    };
  }

  private getTeamStatsTool(): Tool {
    return {
      name: 'get_team_stats',
      description: 'Get team statistics for season/week/date ranges',
      inputSchema: {
        type: 'object',
        properties: {
          teamKey: { type: 'string', description: 'Team key (e.g., "414.l.123456.t.1")' },
          statType: {
            type: 'string',
            enum: ['season', 'lastweek', 'lastmonth', 'date', 'week'],
            default: 'season',
          },
          season: { type: 'string', description: 'Season year, e.g., "2024"' },
          week: { type: 'string', description: 'Week number for weekly stats' },
          date: { type: 'string', description: 'Date for daily stats (YYYY-MM-DD)' },
        },
        required: ['teamKey'],
        additionalProperties: false,
      },
    };
  }
 
  private getTeamContextTool(): Tool {
    return {
      name: 'get_team_context',
      description: 'Build a Fetcher-compliant team context package combining league settings, roster, and matchup snapshot.',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "465.l.27830")',
          },
          teamKey: {
            type: 'string',
            description: 'Team key (e.g., "465.l.27830.t.10")',
          },
          options: {
            type: 'object',
            properties: {
              week: {
                type: 'string',
                description: 'Optional scoring week to target. Defaults to current week.',
              },
            },
            additionalProperties: false,
          },
        },
        required: ['leagueKey', 'teamKey'],
        additionalProperties: false,
      },
    };
  }
 
  private getWaiverClaimsTool(): Tool {

    return {
      name: 'get_waiver_claims',
      description: 'Get pending waiver claims for a specific team',
      inputSchema: {
        type: 'object',
        properties: {
          teamKey: {
            type: 'string',
            description: 'Team key (e.g., "414.l.123456.t.1")',
          },
        },
        required: ['teamKey'],
        additionalProperties: false,
      },
    };
  }

  private addPlayerTool(): Tool {
    return {
      name: 'add_player',
      description: 'Add a player to your team',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          teamKey: {
            type: 'string',
            description: 'Team key (e.g., "414.l.123456.t.1")',
          },
          playerKey: {
            type: 'string',
            description: 'Player key to add (e.g., "414.p.12345")',
          },
        },
        required: ['leagueKey', 'teamKey', 'playerKey'],
        additionalProperties: false,
      },
    };
  }

  private dropPlayerTool(): Tool {
    return {
      name: 'drop_player',
      description: 'Drop a player from your team',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          teamKey: {
            type: 'string',
            description: 'Team key (e.g., "414.l.123456.t.1")',
          },
          playerKey: {
            type: 'string',
            description: 'Player key to drop (e.g., "414.p.12345")',
          },
        },
        required: ['leagueKey', 'teamKey', 'playerKey'],
        additionalProperties: false,
      },
    };
  }

  private addDropPlayersTool(): Tool {
    return {
      name: 'add_drop_players',
      description: 'Add one player and drop another in a single transaction',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          teamKey: {
            type: 'string',
            description: 'Team key (e.g., "414.l.123456.t.1")',
          },
          addPlayerKey: {
            type: 'string',
            description: 'Player key to add (e.g., "414.p.12345")',
          },
          dropPlayerKey: {
            type: 'string',
            description: 'Player key to drop (e.g., "414.p.67890")',
          },
          faabBid: {
            type: 'number',
            description: 'Optional FAAB bid amount',
            minimum: 0,
          },
        },
        required: ['leagueKey', 'teamKey', 'addPlayerKey', 'dropPlayerKey'],
        additionalProperties: false,
      },
    };
  }

  private proposeTradeTool(): Tool {
    return {
      name: 'propose_trade',
      description: 'Propose a trade between two teams',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          traderTeamKey: {
            type: 'string',
            description: 'Team key of the team proposing the trade (e.g., "414.l.123456.t.1")',
          },
          tradeeTeamKey: {
            type: 'string',
            description: 'Team key of the team receiving the trade proposal (e.g., "414.l.123456.t.2")',
          },
          players: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                playerKey: {
                  type: 'string',
                  description: 'Player key (e.g., "414.p.12345")',
                },
                sourceTeamKey: {
                  type: 'string',
                  description: 'Team key where player is currently (e.g., "414.l.123456.t.1")',
                },
                destinationTeamKey: {
                  type: 'string',
                  description: 'Team key where player will go (e.g., "414.l.123456.t.2")',
                },
              },
              required: ['playerKey', 'sourceTeamKey', 'destinationTeamKey'],
              additionalProperties: false,
            },
            description: 'Array of players involved in the trade',
          },
          tradeNote: {
            type: 'string',
            description: 'Optional note to include with the trade proposal',
          },
        },
        required: ['leagueKey', 'traderTeamKey', 'tradeeTeamKey', 'players'],
        additionalProperties: false,
      },
    };
  }

  private acceptTradeTool(): Tool {
    return {
      name: 'accept_trade',
      description: 'Accept a pending trade proposal',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          transactionKey: {
            type: 'string',
            description: 'Transaction key of the pending trade (e.g., "414.l.123456.tr.2")',
          },
          tradeNote: {
            type: 'string',
            description: 'Optional note to include when accepting the trade',
          },
        },
        required: ['leagueKey', 'transactionKey'],
        additionalProperties: false,
      },
    };
  }

  private rejectTradeTool(): Tool {
    return {
      name: 'reject_trade',
      description: 'Reject a pending trade proposal',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          transactionKey: {
            type: 'string',
            description: 'Transaction key of the pending trade (e.g., "414.l.123456.tr.2")',
          },
          tradeNote: {
            type: 'string',
            description: 'Optional note to include when rejecting the trade',
          },
        },
        required: ['leagueKey', 'transactionKey'],
        additionalProperties: false,
      },
    };
  }

  private cancelTradeTool(): Tool {
    return {
      name: 'cancel_trade',
      description: 'Cancel a trade proposal that you initiated',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          transactionKey: {
            type: 'string',
            description: 'Transaction key of the pending trade (e.g., "414.l.123456.tr.2")',
          },
        },
        required: ['leagueKey', 'transactionKey'],
        additionalProperties: false,
      },
    };
  }

  private voteOnTradeTool(): Tool {
    return {
      name: 'vote_on_trade',
      description: 'Vote on a pending trade (if league allows voting)',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          transactionKey: {
            type: 'string',
            description: 'Transaction key of the pending trade (e.g., "414.l.123456.tr.2")',
          },
          vote: {
            type: 'string',
            enum: ['allow', 'veto'],
            description: 'Vote to allow or veto the trade',
          },
        },
        required: ['leagueKey', 'transactionKey', 'vote'],
        additionalProperties: false,
      },
    };
  }

  private cancelWaiverClaimTool(): Tool {
    return {
      name: 'cancel_waiver_claim',
      description: 'Cancel a pending waiver claim',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          transactionKey: {
            type: 'string',
            description: 'Transaction key of the pending waiver claim (e.g., "414.l.123456.w.1")',
          },
        },
        required: ['leagueKey', 'transactionKey'],
        additionalProperties: false,
      },
    };
  }

  private editWaiverClaimTool(): Tool {
    return {
      name: 'edit_waiver_claim',
      description: 'Edit a pending waiver claim (update FAAB bid or priority)',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          transactionKey: {
            type: 'string',
            description: 'Transaction key of the pending waiver claim (e.g., "414.l.123456.w.1")',
          },
          faabBid: {
            type: 'number',
            description: 'New FAAB bid amount',
            minimum: 0,
          },
          priority: {
            type: 'number',
            description: 'Optional new priority for the waiver claim',
            minimum: 1,
          },
        },
        required: ['leagueKey', 'transactionKey', 'faabBid'],
        additionalProperties: false,
      },
    };
  }

  private editLeagueSettingsTool(): Tool {
    return {
      name: 'edit_league_settings',
      description: 'Edit league settings (commissioner only). Modify draft time, waiver rules, trade settings, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          settings: {
            type: 'object',
            description: 'Settings to update. Keys in camelCase will be converted to snake_case for the API.',
            properties: {
              draftTime: { type: 'string', description: 'Draft time (timestamp)' },
              draftType: { type: 'string', description: 'Draft type (live, offline, etc.)' },
              isAuctionDraft: { type: 'string', description: '0 or 1' },
              waiverType: { type: 'string', description: 'Waiver type (waiver, continual, etc.)' },
              waiverTime: { type: 'string', description: 'Waiver processing time' },
              tradeEndDate: { type: 'string', description: 'Trade deadline date' },
              tradeRejectTime: { type: 'string', description: 'Trade review period' },
              postDraftPlayers: { type: 'string', description: 'Post-draft player pool' },
              maxTeams: { type: 'string', description: 'Maximum number of teams' },
            },
            additionalProperties: true,
          },
        },
        required: ['leagueKey', 'settings'],
        additionalProperties: false,
      },
    };
  }

  private manageRosterTool(): Tool {
    return {
      name: 'manage_roster',
      description: 'Manage team roster (commissioner only). Add or drop players for any team in the league.',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          teamKey: {
            type: 'string',
            description: 'Team key to manage (e.g., "414.l.123456.t.1")',
          },
          action: {
            type: 'string',
            enum: ['add', 'drop', 'add_drop'],
            description: 'Action to perform: add, drop, or add_drop',
          },
          addPlayerKey: {
            type: 'string',
            description: 'Player key to add (required for add and add_drop actions)',
          },
          dropPlayerKey: {
            type: 'string',
            description: 'Player key to drop (required for drop and add_drop actions)',
          },
        },
        required: ['leagueKey', 'teamKey', 'action'],
        additionalProperties: false,
      },
    };
  }

  private processTransactionTool(): Tool {
    return {
      name: 'process_transaction',
      description: 'Process pending transactions (commissioner only). Approve or reject pending trades, waiver claims, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          transactionKey: {
            type: 'string',
            description: 'Transaction key to process (e.g., "414.l.123456.tr.2")',
          },
          action: {
            type: 'string',
            enum: ['approve', 'reject'],
            description: 'Action to take: approve or reject',
          },
          note: {
            type: 'string',
            description: 'Optional note explaining the decision',
          },
        },
        required: ['leagueKey', 'transactionKey', 'action'],
        additionalProperties: false,
      },
    };
  }

  private editTeamRosterTool(): Tool {
    return {
      name: 'edit_team_roster',
      description: 'Edit team roster positions (commissioner only). Directly set player positions on a team\'s roster.',
      inputSchema: {
        type: 'object',
        properties: {
          leagueKey: {
            type: 'string',
            description: 'League key (e.g., "414.l.123456")',
          },
          teamKey: {
            type: 'string',
            description: 'Team key to edit (e.g., "414.l.123456.t.1")',
          },
          playerChanges: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                playerKey: {
                  type: 'string',
                  description: 'Player key (e.g., "414.p.12345")',
                },
                position: {
                  type: 'string',
                  description: 'Position to set (e.g., "QB", "RB", "BN", "IR")',
                },
              },
              required: ['playerKey', 'position'],
              additionalProperties: false,
            },
            description: 'Array of player position changes',
          },
        },
        required: ['leagueKey', 'teamKey', 'playerChanges'],
        additionalProperties: false,
      },
    };
  }

  /**
   * Execute a tool by name with parameters
   */
  async executeTool(name: string, args: any): Promise<any> {
    try {
      switch (name) {
        case 'get_user_games':
          return await this.client.getUserGames(args.gameKeys);

        case 'get_user_leagues':
          return await this.client.getUserLeagues(args.gameKey);

        case 'get_user_profile':
          return await this.client.getUserProfile();

        case 'get_user_teams':
          return await this.client.getUserTeams();

        case 'get_league_history':
          return await this.client.getLeagueHistory(args.leagueKey);

        case 'get_team_history':
          return await this.client.getTeamHistory(args.teamKey);

        case 'get_game_info':
          return await this.client.getGameInfo(args.gameKey);

        case 'get_game_metadata':
          return await this.client.getGameMetadata(args.gameKey);

        case 'get_game_stat_categories':
          return await this.client.getGameStatCategories(args.gameKey);

        case 'get_league':
          return await this.client.getLeague(args.leagueKey, args.filters);

        case 'get_league_settings':
          return await this.client.getLeagueSettings(args.leagueKey);

        case 'get_league_metadata':
          return await this.client.getLeagueMetadata(args.leagueKey);

        case 'get_league_rosters':
          return await this.client.getLeagueRosters(args.leagueKey);

        case 'get_draft_results':
          return await this.client.getDraftResults(args.leagueKey);

        case 'get_draft_teams':
          return await this.client.getDraftTeams(args.leagueKey);

        case 'get_draft_settings':
          return await this.client.getDraftSettings(args.leagueKey);

        case 'get_league_standings':
          return await this.client.getLeagueStandings(args.leagueKey);

        case 'get_league_teams':
          return await this.client.getLeagueTeams(args.leagueKey, args.filters);

        case 'get_league_scoreboard':
          return await this.client.getLeagueScoreboard(args.leagueKey, args.week);

        case 'get_matchup_details':
          return await this.client.getMatchupDetails(args.leagueKey, args.week, args.teamKeys);

        case 'get_league_stats':
          return await this.client.getLeagueStats(args.leagueKey);

        case 'get_live_scores':
          return await this.client.getLiveScores(args.leagueKey, args.week);

        case 'get_game_updates':
          return await this.client.getGameUpdates(args.gameKey);

        case 'get_league_transactions':
          return await this.client.getLeagueTransactions(args.leagueKey, args.filters);

        case 'get_league_players':
          return await this.client.getLeaguePlayers(args.leagueKey, args.filters);

        case 'get_team':
          return await this.client.getTeam(args.teamKey, args.filters);

        case 'get_team_roster':
          return await this.client.getTeamRoster(args.teamKey, args.week);

        case 'get_team_matchups':
          return await this.client.getTeamMatchups(args.teamKey, args.week);

        case 'get_team_transactions':
          return await this.client.getTeamTransactions(args.teamKey, args.filters);

        case 'get_player':
          return await this.client.getPlayer(args.playerKey);

        case 'get_player_stats':
          return await this.client.getPlayerStats(args.playerKey, args.statType, {
            season: args.season,
            week: args.week,
            date: args.date,
          });

        case 'get_player_ownership':
          return await this.client.getPlayerOwnership(args.leagueKey, args.playerKey);

        case 'get_player_notes':
          return await this.client.getPlayerNotes(args.playerKey);

        case 'search_players':
          return await this.client.searchPlayers(args.gameKey, args.filters);

        case 'search_players_by_position':
          return await this.client.searchPlayersByPosition(args.leagueKey, args.position, args.filters);

        case 'get_injured_reserve':
          return await this.client.getInjuredReserve(args.teamKey);

        case 'get_free_agents':
          return await this.client.getFreeAgents(
            args.leagueKey,
            args.position,
            args.status,
            args.count,
            args.start
          );

        case 'get_team_stats':
          return await this.client.getTeamStats(args.teamKey, args.statType, {
            season: args.season,
            week: args.week,
            date: args.date,
          });
 
        case 'get_team_context':
          return await this.buildTeamContext(args.leagueKey, args.teamKey, args.options);
 
        case 'get_waiver_claims':
          return await this.client.getWaiverClaims(args.teamKey);


        case 'add_player':
          return await this.client.addPlayer(args.leagueKey, args.teamKey, args.playerKey);

        case 'drop_player':
          return await this.client.dropPlayer(args.leagueKey, args.teamKey, args.playerKey);

        case 'add_drop_players':
          return await this.client.addDropPlayers(
            args.leagueKey,
            args.teamKey,
            args.addPlayerKey,
            args.dropPlayerKey,
            args.faabBid
          );

        case 'propose_trade':
          return await this.client.proposeTrade(
            args.leagueKey,
            args.traderTeamKey,
            args.tradeeTeamKey,
            args.players,
            args.tradeNote
          );

        case 'accept_trade':
          return await this.client.acceptTrade(args.leagueKey, args.transactionKey, args.tradeNote);

        case 'reject_trade':
          return await this.client.rejectTrade(args.leagueKey, args.transactionKey, args.tradeNote);

        case 'cancel_trade':
          return await this.client.cancelTrade(args.leagueKey, args.transactionKey);

        case 'vote_on_trade':
          return await this.client.voteOnTrade(args.leagueKey, args.transactionKey, args.vote);

        case 'cancel_waiver_claim':
          return await this.client.cancelWaiverClaim(args.leagueKey, args.transactionKey);

        case 'edit_waiver_claim':
          return await this.client.editWaiverClaim(
            args.leagueKey,
            args.transactionKey,
            args.faabBid,
            args.priority
          );

        case 'edit_league_settings':
          return await this.client.editLeagueSettings(args.leagueKey, args.settings);

        case 'manage_roster':
          return await this.client.manageRoster(
            args.leagueKey,
            args.teamKey,
            args.action,
            {
              addPlayerKey: args.addPlayerKey,
              dropPlayerKey: args.dropPlayerKey,
            }
          );

        case 'process_transaction':
          return await this.client.processTransaction(
            args.leagueKey,
            args.transactionKey,
            args.action,
            args.note
          );

        case 'edit_team_roster':
          return await this.client.editTeamRoster(
            args.leagueKey,
            args.teamKey,
            args.playerChanges
          );

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }

  private async buildTeamContext(
    leagueKey: string,
    teamKey: string,
    options?: { week?: string }
  ): Promise<any> {
    const week = options?.week;

    const [leagueSettingsRaw, teamWithPlayers, scoreboardResult, teamMatchupsResult] = await Promise.all([
      this.client.getLeagueSettings(leagueKey) as any,
      this.client.getTeam(teamKey, { players: true }) as any,
      this.client.getLeagueScoreboard(leagueKey, week),
      this.client.getTeamMatchups(teamKey, week),
    ]);

    const leagueArray = Array.isArray(leagueSettingsRaw?.league) ? leagueSettingsRaw.league : [];
    const leagueMeta = leagueArray[0] ?? {};
    const settingsSection = leagueArray.find((entry: any) => entry?.settings)?.settings ?? [];
    const primarySettings = Array.isArray(settingsSection) ? settingsSection[0] ?? {} : {};

    const rosterSummary = this.parseRosterPositionsSummary(primarySettings.roster_positions);
    const statCategories = (primarySettings.stat_categories?.stats ?? [])
      .map((stat: any) => stat?.stat?.display_name ?? stat?.stat?.abbr)
      .filter(Boolean);

    const teamArray = Array.isArray(teamWithPlayers?.team) ? teamWithPlayers.team : [];
    const teamMetaArray = Array.isArray(teamArray[0]) ? teamArray[0] : [];
    const teamMeta = this.flattenYahooObjectArray(teamMetaArray);
    const players = this.parseTeamPlayers(teamWithPlayers);

    const totalSpots = rosterSummary.total || players.length;
    const availableSpots = Math.max(totalSpots - players.length, 0);

    const weeklyAddsLimit = primarySettings.max_weekly_adds ? Number(primarySettings.max_weekly_adds) : null;
    const weeklyAddsUsed = teamMeta.roster_adds?.value ? Number(teamMeta.roster_adds.value) : null;
    const weeklyAddsRemaining =
      weeklyAddsLimit !== null && weeklyAddsUsed !== null
        ? Math.max(weeklyAddsLimit - weeklyAddsUsed, 0)
        : null;

    const filledPositions = this.summarizeFilledPositions(players);

    const scoreboardMatchup = this.findMatchupForTeam(teamKey, scoreboardResult.matchups);
    const teamMatchup = this.findMatchupForTeam(teamKey, teamMatchupsResult.matchups);
    const chosenMatchup = scoreboardMatchup || teamMatchup;

    const currentWeek = Number(leagueMeta.current_week || chosenMatchup?.week || 0) || null;

    const errors: string[] = [];
    if (!players.length) {
      errors.push('Team roster returned zero players from Yahoo API.');
    }
    if (!scoreboardResult.matchups.length) {
      errors.push('League scoreboard returned no current matchups.');
    }

    const dataComplete = Boolean(players.length && statCategories.length && scoreboardResult.matchups.length);

    return {
      fetch_type: 'TEAM_CONTEXT',
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      request: {
        sport: leagueMeta.game_code || 'nhl',
        league_name: leagueMeta.name || null,
        league_url: leagueMeta.url || null,
      },
      identifiers: {
        league_key: leagueMeta.league_key || leagueKey,
        team_key: teamMeta.team_key || teamKey,
        team_name: teamMeta.name || null,
        game_key: leagueMeta.game_code || null,
      },
      league_settings: {
        scoring_type: this.normalizeScoringType(leagueMeta.scoring_type || primarySettings.scoring_type),
        scoring_categories: statCategories,
        roster_positions: rosterSummary.positions,
        transaction_limits: {
          weekly_adds_limit: weeklyAddsLimit,
          weekly_adds_used: weeklyAddsUsed,
          weekly_adds_remaining: weeklyAddsRemaining,
        },
        waiver_rules: {
          type: this.deriveWaiverType(primarySettings.waiver_type),
          budget: primarySettings.uses_faab === '1' ? Number(primarySettings.faab_budget ?? 0) : null,
          budget_remaining: primarySettings.uses_faab === '1' ? Number(primarySettings.faab_remaining ?? 0) : null,
          waiver_time_days: primarySettings.waiver_time ? Number(primarySettings.waiver_time) : null,
        },
        lock_type: this.normalizeLockType(leagueMeta.weekly_deadline),
        trade_deadline: primarySettings.trade_end_date || null,
      },
      current_roster: {
        total_spots: totalSpots,
        filled_spots: players.length,
        available_spots: availableSpots,
        players,
        position_analysis: {
          filled_positions: filledPositions,
          bench: null,
          ir: null,
          notes: 'Lineup positions not provided by Yahoo response; counts derived from listed player positions only.',
        },
      },
      current_matchup: {
        week: chosenMatchup?.week ?? currentWeek,
        opponent: chosenMatchup?.opponent ?? null,
        scores: chosenMatchup?.scores ?? null,
        status: chosenMatchup?.status ?? (scoreboardMatchup ? 'in_progress' : 'not_started'),
      },
      validation: {
        all_keys_valid: Boolean((leagueMeta.league_key || leagueKey) && (teamMeta.team_key || teamKey)),
        data_complete: dataComplete,
        errors,
      },
      for_agent: {
        recommendations_agent: {
          action_required: availableSpots > 0,
          priority: availableSpots > 0 ? `Fill ${availableSpots} open roster spots` : 'Monitor roster composition',
        },
        manager_agent: {
          transaction_capacity: weeklyAddsRemaining,
          ready_for_execution: weeklyAddsRemaining !== null ? weeklyAddsRemaining > 0 : null,
        },
      },
    };
  }

  private flattenYahooObjectArray(items: any[]): Record<string, any> {
    const result: Record<string, any> = {};
    for (const item of items || []) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        continue;
      }
      for (const [key, value] of Object.entries(item)) {
        if (result[key] === undefined) {
          result[key] = value;
        }
      }
    }
    return result;
  }

  private parseRosterPositionsSummary(rosterPositionsRaw: any): { positions: Record<string, number>; total: number } {
    const positions: Record<string, number> = {};
    let total = 0;
    if (Array.isArray(rosterPositionsRaw)) {
      for (const item of rosterPositionsRaw) {
        const rosterPosition = item?.roster_position ?? item;
        if (!rosterPosition) continue;
        const position = rosterPosition.position;
        const count = Number(rosterPosition.count ?? 0);
        if (!position) continue;
        positions[position] = count;
        total += count;
      }
    }
    return { positions, total };
  }

  private parseTeamPlayers(teamResponse: any): any[] {
    const teamArray = Array.isArray(teamResponse?.team) ? teamResponse.team : [];
    const playersContainerEntry = teamArray.find((entry: any) => entry?.players);
    const playersContainer = playersContainerEntry?.players;
    if (!playersContainer || typeof playersContainer !== 'object') {
      return [];
    }

    const players: any[] = [];
    for (const key in playersContainer) {
      if (key === 'count') continue;
      const playerEntryArray = playersContainer[key]?.player;
      if (!Array.isArray(playerEntryArray)) continue;
      const flattened = this.flattenYahooObjectArray(playerEntryArray);
      const eligibility = Array.isArray(flattened.eligible_positions)
        ? flattened.eligible_positions.map((pos: any) => pos?.position).filter(Boolean)
        : [];
      const eligibleToAdd = Array.isArray(flattened.eligible_positions_to_add)
        ? flattened.eligible_positions_to_add.map((pos: any) => pos?.position).filter(Boolean)
        : [];

      players.push({
        player_key: flattened.player_key || null,
        name: flattened.name?.full || null,
        position: flattened.display_position || flattened.primary_position || null,
        team: flattened.editorial_team_abbr || flattened.editorial_team_full_name || null,
        lineup_position: flattened.selected_position?.position || null,
        injury_status: flattened.status || flattened.injury_status || null,
        eligibility,
        eligible_positions_to_add: eligibleToAdd,
      });
    }
    return players;
  }

  private summarizeFilledPositions(players: Array<{ position: string | null }>): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const player of players) {
      if (!player.position) continue;
      const positionTokens = player.position.split(',').map((token) => token.trim()).filter(Boolean);
      for (const token of positionTokens) {
        summary[token] = (summary[token] || 0) + 1;
      }
    }
    return summary;
  }

  private deriveWaiverType(code?: string): string | null {
    if (!code) return null;
    switch (code) {
      case 'R':
        return 'rolling';
      case 'F':
        return 'faab';
      case 'V':
        return 'continual';
      default:
        return code;
    }
  }

  private normalizeScoringType(type?: string | null): string | null {
    if (!type) return null;
    const normalized = String(type).toLowerCase();
    if (normalized === 'head') return 'head-to-head-category';
    if (normalized === 'points') return 'head-to-head-points';
    return type;
  }

  private normalizeLockType(deadline?: string | null): string | null {
    if (!deadline) return null;
    const normalized = String(deadline).toLowerCase();
    if (normalized === 'intraday') return 'daily';
    if (normalized === 'weekly') return 'weekly';
    return deadline;
  }

  private findMatchupForTeam(teamKey: string, matchups: any[]): {
    week: number | null;
    status: string | null;
    opponent: { team_key: string | null; team_name: string | null } | null;
    scores: { your_team: number | null; opponent: number | null } | null;
  } | null {
    if (!Array.isArray(matchups)) {
      return null;
    }

    for (const matchupEntry of matchups) {
      if (!Array.isArray(matchupEntry)) {
        continue;
      }

      const metadata = this.flattenYahooObjectArray(matchupEntry);
      const teamsContainer =
        metadata.teams || matchupEntry.find((item: any) => item?.teams)?.teams || null;
      const teams = this.parseMatchupTeams(teamsContainer);
      if (!teams.length) continue;

      const selfTeam = teams.find((team) => team.team_key === teamKey);
      if (!selfTeam) continue;
      const opponentTeam = teams.find((team) => team.team_key !== teamKey) || null;

      const weekValue =
        metadata.week ??
        metadata.matchup_week ??
        metadata.week_number ??
        metadata.week_start ??
        null;
      const weekNumber = weekValue ? Number(weekValue) || null : null;

      return {
        week: weekNumber,
        status: metadata.status || null,
        opponent: opponentTeam
          ? {
              team_key: opponentTeam.team_key || null,
              team_name: opponentTeam.name || null,
            }
          : null,
        scores: this.buildScorePayload(selfTeam, opponentTeam),
      };
    }

    return null;
  }

  private parseMatchupTeams(teamsContainer: any): Array<Record<string, any>> {
    const teams: Record<string, any>[] = [];
    if (!teamsContainer || typeof teamsContainer !== 'object') {
      return teams;
    }

    for (const key in teamsContainer) {
      if (key === 'count') continue;
      const teamEntry = teamsContainer[key]?.team;
      if (Array.isArray(teamEntry)) {
        teams.push(this.flattenYahooObjectArray(teamEntry));
      } else if (teamEntry && typeof teamEntry === 'object') {
        teams.push(teamEntry);
      }
    }

    return teams;
  }

  private buildScorePayload(
    selfTeam: Record<string, any> | null,
    opponentTeam: Record<string, any> | null
  ): { your_team: number | null; opponent: number | null } | null {
    const yourScore = this.extractTeamScore(selfTeam);
    const opponentScore = this.extractTeamScore(opponentTeam);
    if (yourScore === null && opponentScore === null) {
      return null;
    }
    return {
      your_team: yourScore,
      opponent: opponentScore,
    };
  }

  private extractTeamScore(team: Record<string, any> | null): number | null {
    if (!team) return null;
    const points = team.team_points || team.points || team.score || null;
    if (!points) return null;

    if (typeof points === 'object') {
      const total = points.total ?? points.points ?? points.value ?? points.score;
      if (total !== undefined) {
        const numeric = Number(total);
        return Number.isFinite(numeric) ? numeric : null;
      }
    } else if (typeof points === 'string' || typeof points === 'number') {
      const numeric = Number(points);
      return Number.isFinite(numeric) ? numeric : null;
    }

    return null;
  }
}
