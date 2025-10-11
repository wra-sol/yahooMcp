import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { YahooFantasyClient } from '../api/yahoo-fantasy-client.js';
import { 
  OAuthCredentials,
  YahooFantasyError,
  RosterLockedError,
  RosterConstraintError,
  AuthenticationError,
  InsufficientPermissionsError,
  NetworkError,
  RateLimitError,
} from '../types/index.js';

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

interface StatCategoryMeta {
  id: string;
  name: string | null;
  displayName: string | null;
  abbreviation: string | null;
  isLowerBetter: boolean;
  index: number;
}

interface ParsedStatValue {
  raw: string | number | null;
  numeric: number | null;
}

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
      this.httpRequestTool(),
      this.getStartActivePlayersTool(),
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
      description: 'Edit team roster positions. Set player positions on a team\'s roster to manage your starting lineup, bench, and injured reserve. Move players between positions like QB, RB, WR, BN, IR, etc.',
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
          date: {
            type: 'string',
            description: 'Target date (YYYY-MM-DD) for daily leagues; defaults to tomorrow if omitted',
          },
          week: {
            type: 'string',
            description: 'Target week number for weekly leagues',
          },
          coverageType: {
            type: 'string',
            enum: ['date', 'week'],
            description: 'Optional override for coverage type; inferred when omitted',
          },
        },
        required: ['leagueKey', 'teamKey', 'playerChanges'],
        additionalProperties: false,
      },
    };
  }

  private httpRequestTool(): Tool {
    return {
      name: 'http_request',
      description: `Fetch fantasy sports news, analysis, and player information from expert websites. 
      
Recommended fantasy sports outlets by sport:
• NFL: FantasyPros (fantasypros.com/nfl), RotoWire (rotowire.com/football), NBC Sports Edge (nbcsports.com/fantasy/football), PFF Fantasy (pff.com/fantasy)
• NBA: RotoWire (rotowire.com/basketball), Basketball Monster (basketballmonster.com), Hashtag Basketball (hashtagbasketball.com)
• MLB: RotoWire (rotowire.com/baseball), FanGraphs (fangraphs.com/blogs/category/fantasy), Baseball Prospectus (baseballprospectus.com/fantasy)
• NHL: RotoWire (rotowire.com/hockey), DobberHockey (dobberhockey.com), Daily Faceoff (dailyfaceoff.com)
• Soccer: RotoWire (rotowire.com/soccer), Fantasy Football Scout (fantasyfootballscout.co.uk), Fantasy Premier League (fantasy.premierleague.com)

Use this tool to gather injury updates, start/sit recommendations, waiver wire targets, trade analysis, and expert rankings.`,
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Full URL to fetch (e.g., "https://www.fantasypros.com/nfl/players/player.php")',
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST'],
            default: 'GET',
            description: 'HTTP method to use',
          },
          headers: {
            type: 'object',
            description: 'Optional HTTP headers as key-value pairs',
            additionalProperties: { type: 'string' },
          },
          params: {
            type: 'object',
            description: 'Optional URL query parameters as key-value pairs',
            additionalProperties: { type: 'string' },
          },
          body: {
            type: 'string',
            description: 'Optional request body for POST requests (JSON string)',
          },
          timeout: {
            type: 'number',
            description: 'Request timeout in milliseconds (default: 10000)',
            default: 10000,
            minimum: 1000,
            maximum: 30000,
          },
          followRedirects: {
            type: 'boolean',
            description: 'Whether to follow HTTP redirects (default: true)',
            default: true,
          },
        },
        required: ['url'],
        additionalProperties: false,
      },
    };
  }

  private getStartActivePlayersTool(): Tool {
    return {
      name: 'start_active_players',
      description: `Optimize lineup using "START ACTIVE" strategy - prioritize players with games scheduled.
      
This tool implements the START ACTIVE strategy:
1. PRIORITY 1: Players with games today/tomorrow MUST be in starting lineup
2. PRIORITY 2: Among active players, rank by recent performance (hot/cold streaks)
3. PRIORITY 3: Among similar performers, favor better matchups

The tool analyzes your roster and returns lineup change recommendations that:
- Maximize number of active players (with games) in starting positions
- Never benches players with games unless all starting slots are filled with active players
- Ranks active players by performance quality (recent stats)
- Only benches players who have NO game scheduled

Perfect for daily leagues (NHL/MLB/NBA) where lineup optimization is crucial.`,
      inputSchema: {
        type: 'object',
        properties: {
          teamKey: {
            type: 'string',
            description: 'Team key (e.g., "465.l.27830.t.10")',
          },
          date: {
            type: 'string',
            description: 'Target date for lineup (YYYY-MM-DD format). For daily leagues, use tomorrow\'s date. Optional - defaults to tomorrow.',
          },
          week: {
            type: 'number',
            description: 'Target week for lineup (for weekly leagues). Optional.',
          },
          includeStats: {
            type: 'boolean',
            description: 'Whether to include detailed player stats in response (default: true)',
            default: true,
          },
          autoExecute: {
            type: 'boolean',
            description: 'Whether to automatically execute the lineup changes (default: false - returns recommendations only)',
            default: false,
          },
        },
        required: ['teamKey'],
        additionalProperties: false,
      },
    };
  }

  /**
   * Utility: Check if a player is available in the league
   */
  async isPlayerAvailable(leagueKey: string, playerKey: string): Promise<boolean> {
    try {
      const ownership = await this.client.getPlayerOwnership(leagueKey, playerKey);
      // Player is available if ownership indicates no team owns them
      return !ownership?.ownership?.owner_team_key;
    } catch (error) {
      return false;
    }
  }

  /**
   * Utility: Get simplified roster summary for quick analysis
   */
  async getRosterSummary(teamKey: string): Promise<{
    totalPlayers: number;
    byPosition: Record<string, number>;
    injured: number;
    bench: number;
    starters: number;
  }> {
    const roster = await this.client.getTeamRoster(teamKey);
    const players = this.parseTeamPlayers({ team: [roster] });
    
    const byPosition: Record<string, number> = {};
    let injured = 0;
    let bench = 0;
    let starters = 0;

    for (const player of players) {
      const pos = player.lineup_position || player.position;
      if (pos) {
        byPosition[pos] = (byPosition[pos] || 0) + 1;
      }
      
      if (player.injury_status && player.injury_status !== 'H') {
        injured++;
      }
      
      if (player.lineup_position === 'BN') {
        bench++;
      } else if (player.lineup_position && player.lineup_position !== 'IR' && player.lineup_position !== 'IL') {
        starters++;
      }
    }

    return {
      totalPlayers: players.length,
      byPosition,
      injured,
      bench,
      starters,
    };
  }

  /**
   * Utility: Check if team can add players (has roster space and weekly adds remaining)
   */
  async canAddPlayers(leagueKey: string, teamKey: string): Promise<{
    canAdd: boolean;
    reason?: string;
    rosterSpace: boolean;
    weeklyAddsRemaining: number | null;
  }> {
    const [settings, team] = await Promise.all([
      this.client.getLeagueSettings(leagueKey),
      this.client.getTeam(teamKey, { players: true }),
    ]);

    const settingsData = Array.isArray((settings as any)?.league) ? (settings as any).league : [];
    const settingsSection = settingsData.find((entry: any) => entry?.settings)?.settings ?? [];
    const primarySettings = Array.isArray(settingsSection) ? settingsSection[0] ?? {} : {};
    
    const maxRosterSize = primarySettings.roster_positions
      ? this.parseRosterPositionsSummary(primarySettings.roster_positions).total
      : null;
    
    const teamArray = Array.isArray((team as any)?.team) ? (team as any).team : [];
    const teamMetaArray = Array.isArray(teamArray[0]) ? teamArray[0] : [];
    const teamMeta = this.flattenYahooObjectArray(teamMetaArray);
    const currentPlayers = this.parseTeamPlayers(team as any).length;

    const rosterSpace = maxRosterSize ? currentPlayers < maxRosterSize : true;
    
    const weeklyAddsLimit = primarySettings.max_weekly_adds ? Number(primarySettings.max_weekly_adds) : null;
    const weeklyAddsUsed = teamMeta.roster_adds?.value ? Number(teamMeta.roster_adds.value) : 0;
    const weeklyAddsRemaining = weeklyAddsLimit !== null ? Math.max(weeklyAddsLimit - weeklyAddsUsed, 0) : null;

    let canAdd = true;
    let reason: string | undefined;

    if (!rosterSpace) {
      canAdd = false;
      reason = 'No roster space available. Must drop a player first.';
    } else if (weeklyAddsRemaining !== null && weeklyAddsRemaining <= 0) {
      canAdd = false;
      reason = 'Weekly add limit reached.';
    }

    return {
      canAdd,
      reason,
      rosterSpace,
      weeklyAddsRemaining,
    };
  }

  /**
   * Utility: Get FAAB budget remaining for a team
   */
  async getFAABRemaining(leagueKey: string, teamKey: string): Promise<{
    usesFAAB: boolean;
    budgetTotal: number | null;
    budgetRemaining: number | null;
  }> {
    const settings = await this.client.getLeagueSettings(leagueKey);
    const team = await this.client.getTeam(teamKey);

    const settingsData = Array.isArray((settings as any)?.league) ? (settings as any).league : [];
    const settingsSection = settingsData.find((entry: any) => entry?.settings)?.settings ?? [];
    const primarySettings = Array.isArray(settingsSection) ? settingsSection[0] ?? {} : {};

    const usesFAAB = primarySettings.uses_faab === '1';
    const budgetTotal = usesFAAB ? Number(primarySettings.faab_budget ?? 0) : null;
    
    // Get team's remaining FAAB from team metadata
    const teamArray = Array.isArray((team as any)?.team) ? (team as any).team : [];
    const teamMetaArray = Array.isArray(teamArray[0]) ? teamArray[0] : [];
    const teamMeta = this.flattenYahooObjectArray(teamMetaArray);
    const budgetRemaining = usesFAAB && teamMeta.faab_balance ? Number(teamMeta.faab_balance) : budgetTotal;

    return {
      usesFAAB,
      budgetTotal,
      budgetRemaining,
    };
  }

  /**
   * Utility: Compare two players side-by-side
   */
  async comparePlayers(
    playerKey1: string,
    playerKey2: string,
    statType: 'season' | 'lastweek' | 'lastmonth' | 'date' | 'week' = 'season'
  ): Promise<{
    player1: any;
    player2: any;
    comparison: Record<string, { player1: any; player2: any; winner: string | null }>;
  }> {
    const [player1Data, player2Data, stats1, stats2] = await Promise.all([
      this.client.getPlayer(playerKey1),
      this.client.getPlayer(playerKey2),
      this.client.getPlayerStats(playerKey1, statType).catch(() => null),
      this.client.getPlayerStats(playerKey2, statType).catch(() => null),
    ]);

    const comparison: Record<string, { player1: any; player2: any; winner: string | null }> = {};
    
    // Basic comparison of available stats
    if (stats1 && stats2) {
      // Extract stats from Yahoo response structure
      const extractStats = (statsResponse: any) => {
        const playerArray = Array.isArray(statsResponse?.player) ? statsResponse.player : [];
        const statsEntry = playerArray.find((entry: any) => entry?.player_stats);
        return statsEntry?.player_stats?.stats || [];
      };

      const p1Stats = extractStats(stats1);
      const p2Stats = extractStats(stats2);
      
      // Compare each stat
      for (const stat of p1Stats) {
        const statId = stat?.stat?.stat_id;
        const statName = stat?.stat?.name || stat?.stat?.display_name;
        const p1Value = Number(stat?.stat?.value || 0);
        
        const p2Stat = p2Stats.find((s: any) => s?.stat?.stat_id === statId);
        const p2Value = p2Stat ? Number(p2Stat.stat?.value || 0) : 0;
        
        if (statName) {
          comparison[statName] = {
            player1: p1Value,
            player2: p2Value,
            winner: p1Value > p2Value ? 'player1' : p2Value > p1Value ? 'player2' : null,
          };
        }
      }
    }

    return {
      player1: player1Data,
      player2: player2Data,
      comparison,
    };
  }

  /**
   * Utility: Get droppable players from a roster (players on bench with lowest value)
   */
  async getDropCandidates(
    teamKey: string,
    limit: number = 5
  ): Promise<Array<{ playerKey: string; name: string; reason: string }>> {
    const roster = await this.client.getTeamRoster(teamKey);
    const players = this.parseTeamPlayers({ team: [roster] });
    
    const candidates: Array<{ playerKey: string; name: string; reason: string }> = [];

    // Identify bench players
    for (const player of players) {
      if (player.lineup_position === 'BN') {
        candidates.push({
          playerKey: player.player_key,
          name: player.name,
          reason: 'On bench',
        });
      }
    }

    // Identify injured players on IR
    for (const player of players) {
      if (player.lineup_position === 'IR' || player.lineup_position === 'IL') {
        candidates.push({
          playerKey: player.player_key,
          name: player.name,
          reason: 'On injured reserve',
        });
      }
    }

    return candidates.slice(0, limit);
  }

  /**
   * Utility: Validate a transaction before submitting
   */
  async validateTransaction(
    leagueKey: string,
    teamKey: string,
    action: 'add' | 'drop' | 'add_drop',
    playerKeys: { add?: string; drop?: string }
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const canAddResult = await this.canAddPlayers(leagueKey, teamKey);

      if (action === 'add' || action === 'add_drop') {
        if (!playerKeys.add) {
          errors.push('Player to add is required');
        } else {
          // Check if player is available
          const available = await this.isPlayerAvailable(leagueKey, playerKeys.add);
          if (!available) {
            errors.push('Player is not available');
          }
        }

        if (action === 'add' && !canAddResult.rosterSpace) {
          errors.push('No roster space available. Must drop a player.');
        }

        if (!canAddResult.canAdd && canAddResult.reason) {
          warnings.push(canAddResult.reason);
        }
      }

      if (action === 'drop' || action === 'add_drop') {
        if (!playerKeys.drop) {
          errors.push('Player to drop is required');
        } else {
          // Check if team owns the player
          const roster = await this.client.getTeamRoster(teamKey);
          const players = this.parseTeamPlayers({ team: [roster] });
          const ownsPlayer = players.some(p => p.player_key === playerKeys.drop);
          
          if (!ownsPlayer) {
            errors.push('Team does not own the player to drop');
          }
        }
      }
    } catch (error: any) {
      errors.push(`Validation error: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Execute a tool by name with parameters
   */
  async executeTool(name: string, args: any): Promise<any> {
    console.error(`[executeTool] Called with name=${name}, args=${JSON.stringify(args).substring(0, 200)}`);
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

        case 'get_league_scoreboard': {
          const week = args.week || await this.getCurrentWeek(args.leagueKey);
          return await this.client.getLeagueScoreboard(args.leagueKey, week);
        }

        case 'get_matchup_details': {
          const week = args.week || await this.getCurrentWeek(args.leagueKey);
          return await this.client.getMatchupDetails(args.leagueKey, week, args.teamKeys);
        }

        case 'get_league_stats':
          return await this.client.getLeagueStats(args.leagueKey);

        case 'get_live_scores': {
          const week = args.week || await this.getCurrentWeek(args.leagueKey);
          return await this.client.getLiveScores(args.leagueKey, week);
        }

        case 'get_game_updates':
          return await this.client.getGameUpdates(args.gameKey);

        case 'get_league_transactions':
          return await this.client.getLeagueTransactions(args.leagueKey, args.filters);

        case 'get_league_players':
          return await this.client.getLeaguePlayers(args.leagueKey, args.filters);

        case 'get_team':
          return await this.client.getTeam(args.teamKey, args.filters);

        case 'get_team_roster': {
          const leagueKey = this.extractLeagueKeyFromTeamKey(args.teamKey);
          const week = args.week || await this.getCurrentWeek(leagueKey);
          return await this.client.getTeamRoster(args.teamKey, week);
        }

        case 'get_team_matchups': {
          const leagueKey = this.extractLeagueKeyFromTeamKey(args.teamKey);
          const week = args.week || await this.getCurrentWeek(leagueKey);
          return await this.client.getTeamMatchups(args.teamKey, week);
        }

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


        case 'add_player': {
          await this.ensureIrCompliance(args.leagueKey, args.teamKey);
          return await this.client.addPlayer(args.leagueKey, args.teamKey, args.playerKey);
        }

        case 'drop_player':
          return await this.client.dropPlayer(args.leagueKey, args.teamKey, args.playerKey);

        case 'add_drop_players': {
          await this.ensureIrCompliance(args.leagueKey, args.teamKey);
          return await this.client.addDropPlayers(
            args.leagueKey,
            args.teamKey,
            args.addPlayerKey,
            args.dropPlayerKey,
            args.faabBid
          );
        }

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

        case 'manage_roster': {
          if (args.action === 'add' || args.action === 'add_drop') {
            await this.ensureIrCompliance(args.leagueKey, args.teamKey);
          }
          return await this.client.manageRoster(
            args.leagueKey,
            args.teamKey,
            args.action,
            {
              addPlayerKey: args.addPlayerKey,
              dropPlayerKey: args.dropPlayerKey,
            }
          );
        }

        case 'process_transaction':
          return await this.client.processTransaction(
            args.leagueKey,
            args.transactionKey,
            args.action,
            args.note
          );

        case 'edit_team_roster': {
          await this.ensureIrComplianceForRosterEdit(
            args.leagueKey,
            args.teamKey,
            args.playerChanges,
            {
              date: args.date,
              week: args.week,
              coverageType: args.coverageType,
            }
          );
          return await this.client.editTeamRoster(
            args.leagueKey,
            args.teamKey,
            args.playerChanges,
            {
              date: args.date,
              week: args.week,
              coverageType: args.coverageType,
            }
          );
        }

        case 'http_request':
          return await this.executeHttpRequest(args);

        case 'start_active_players':
          return await this.startActivePlayers(
            args.teamKey,
            {
              date: args.date,
              week: args.week,
              includeStats: args.includeStats !== false,
              autoExecute: args.autoExecute === true,
            }
          );

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      // Handle specific error types with better context
      if (error instanceof RosterLockedError) {
        // Provide structured error information for roster locks
        const errorInfo = error.toJSON();
        console.error('Roster lock error:', errorInfo);
        
        throw new Error(
          `Tool '${name}' failed: ${error.message}\n\n` +
          `Error Type: ROSTER_LOCKED\n` +
          `Team: ${error.teamKey || 'Unknown'}\n` +
          `Date: ${error.date || 'Unknown'}\n\n` +
          `Recovery: The roster is locked for this date. You can:\n` +
          `  - Try a future date when the roster will be unlocked\n` +
          `  - Wait until the current game/lock period ends\n` +
          `  - Check the league settings for roster lock times\n\n` +
          `Structured error data:\n${JSON.stringify(errorInfo, null, 2)}`
        );
      }
      
      if (error instanceof RosterConstraintError) {
        // Provide structured error information for roster constraints
        const errorInfo = error.toJSON();
        console.error('Roster constraint error:', errorInfo);
        
        throw new Error(
          `Tool '${name}' failed: ${error.message}\n\n` +
          `Error Type: ROSTER_CONSTRAINT\n` +
          `Constraint: ${error.constraintType?.toUpperCase()}\n` +
          `Position: ${error.position || 'Unknown'}\n` +
          `Player: ${error.playerKey || 'Unknown'}\n\n` +
          `Recovery: ${errorInfo.recovery_suggestion}\n\n` +
          `Common solutions:\n` +
          `  - For "position_filled": Move the current player out first, then move the new player in\n` +
          `  - For "invalid_position": Check the player's eligible_positions list\n` +
          `  - For "roster_limit": Drop a player before adding another\n\n` +
          `Structured error data:\n${JSON.stringify(errorInfo, null, 2)}`
        );
      }
      
      if (error instanceof RateLimitError) {
        const errorInfo = error.toJSON();
        console.error('Rate limit error:', errorInfo);
        const waitTime = error.retryAfter || 60;
        
        throw new Error(
          `Tool '${name}' failed: Rate limit exceeded\n\n` +
          `${error.message}\n\n` +
          `Wait Time: ${waitTime} seconds\n\n` +
          `Recovery: Yahoo API rate limit exceeded. You must:\n` +
          `  - Wait ${waitTime} seconds before retrying\n` +
          `  - Reduce request frequency\n` +
          `  - Implement exponential backoff\n` +
          `  - Cache responses when possible\n\n` +
          `Structured error data:\n${JSON.stringify(errorInfo, null, 2)}`
        );
      }
      
      if (error instanceof NetworkError) {
        console.error('Network error:', error.message);
        throw new Error(
          `Tool '${name}' failed: Network error\n\n` +
          `${error.message}\n\n` +
          `Recovery: This is a network connectivity issue. You can:\n` +
          `  - Check your internet connection\n` +
          `  - Verify the Yahoo API is accessible\n` +
          `  - Retry the request after a brief delay\n` +
          `  - Check for firewall or proxy issues`
        );
      }
      
      if (error instanceof AuthenticationError) {
        console.error('Authentication error:', error.message);
        throw new Error(
          `Tool '${name}' failed: Authentication required\n\n` +
          `${error.message}\n\n` +
          `Recovery: Please re-authenticate using the OAuth flow to get a new access token.`
        );
      }
      
      if (error instanceof InsufficientPermissionsError) {
        console.error('Permission error:', error.message);
        throw new Error(
          `Tool '${name}' failed: Insufficient permissions\n\n` +
          `${error.message}\n\n` +
          `${error.requiredPermission ? `Required: ${error.requiredPermission}\n\n` : ''}` +
          `Recovery: This action requires additional permissions. ` +
          `You may need to be a league commissioner or have specific role permissions.`
        );
      }
      
      if (error instanceof YahooFantasyError) {
        console.error('Yahoo Fantasy API error:', {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
        });
        throw new Error(
          `Tool '${name}' failed: Yahoo API Error\n\n` +
          `Error Code: ${error.code}\n` +
          `Status: ${error.statusCode}\n` +
          `Message: ${error.message}\n\n` +
          `Check that all parameters are valid and the requested resource exists.`
        );
      }
      
      // Generic error handling
      const context = {
        tool: name,
        args: args,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
      
      // Log for debugging but don't expose sensitive data in error message
      console.error('Tool execution failed:', context);
      
      // Re-throw with contextual information
      throw new Error(
        `Tool '${name}' execution failed: ${error.message}\n` +
        `Check that all required parameters are provided and valid.`
      );
    }
  }

  /**
   * Execute HTTP request to external fantasy sports websites
   */
  private async executeHttpRequest(args: any): Promise<any> {
    const {
      url,
      method = 'GET',
      headers = {},
      params = {},
      body,
      timeout = 10000,
      followRedirects = true,
    } = args;

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`);
    }

    // Build full URL with query params
    const urlObj = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.append(key, String(value));
    });

    // Set default headers
    const requestHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (compatible; YahooFantasyMCP/1.0)',
      ...headers,
    };

    // Build fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
      redirect: followRedirects ? 'follow' : 'manual',
      signal: AbortSignal.timeout(timeout),
    };

    // Add body for POST requests
    if (method === 'POST' && body) {
      fetchOptions.body = body;
      if (!requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/json';
      }
    }

    try {
      const response = await fetch(urlObj.toString(), fetchOptions);
      
      // Get response data
      const contentType = response.headers.get('content-type') || '';
      let data: any;
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('text/html') || contentType.includes('text/plain')) {
        data = await response.text();
      } else {
        // For other content types, try to get text
        data = await response.text();
      }

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        url: response.url,
        redirected: response.redirected,
      };
    } catch (error: any) {
      // Handle timeout and network errors
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }

  /**
   * Get client instance for advanced usage
   * WARNING: Direct client access bypasses tool validation
   */
  getClient(): YahooFantasyClient {
    return this.client;
  }

  /**
   * START ACTIVE PLAYERS: Optimize lineup to prioritize players with games scheduled
   * Implements the START ACTIVE strategy: Active players first, then by performance, then by matchup
   */
  private async startActivePlayers(
    teamKey: string,
    options: {
      date?: string;
      week?: number;
      includeStats?: boolean;
      autoExecute?: boolean;
    } = {}
  ): Promise<any> {
    try {
      // Extract league key from team key
      const leagueKey = this.extractLeagueKeyFromTeamKey(teamKey);
      
      console.error(`[START ACTIVE] Analyzing lineup for team ${teamKey}`);
      
      // Get league settings to understand league type (daily/weekly)
      const leagueSettings = await this.client.getLeagueSettings(leagueKey);
      const leagueArray = Array.isArray((leagueSettings as any)?.league) 
        ? (leagueSettings as any).league 
        : [];
      const leagueMeta = leagueArray[0] ?? {};
      const isDaily = leagueMeta.weekly_deadline === 'intraday';
      const lockType = isDaily ? 'daily' : 'weekly';
      
      console.error(`[START ACTIVE] League type: ${lockType}`);
      
      // Determine target date/week
      let targetDate = options.date;
      let targetWeek = options.week;
      
      if (!targetDate && !targetWeek) {
        if (isDaily) {
          // Default to tomorrow for daily leagues
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          targetDate = tomorrow.toISOString().split('T')[0];
          console.error(`[START ACTIVE] Using tomorrow's date: ${targetDate}`);
        } else {
          // Use current week for weekly leagues
          targetWeek = parseInt(leagueMeta.current_week || '1');
          console.error(`[START ACTIVE] Using current week: ${targetWeek}`);
        }
      }
      
      // Get current roster
      const rosterParam = isDaily 
        ? `;date=${targetDate}` 
        : (targetWeek ? `;week=${targetWeek}` : '');
      const roster = await this.client['makeRequest']<any>(
        'GET',
        `/team/${teamKey}/roster${rosterParam}`
      );
      
      // Parse roster players
      const players = this.parseTeamPlayers({ team: [roster] });
      console.error(`[START ACTIVE] Found ${players.length} players on roster`);
      
      // Get stats for each player if requested
      if (options.includeStats) {
        console.error(`[START ACTIVE] Fetching recent stats for all players...`);
        for (const player of players) {
          try {
            const stats = await this.client.getPlayerStats(player.player_key, 'lastweek');
            player.recent_stats = stats;
          } catch (error) {
            console.error(`[START ACTIVE] Could not fetch stats for ${player.name}: ${error}`);
            player.recent_stats = null;
          }
        }
      }
      
      // Analyze players and categorize by position and activity status
      // Note: Yahoo API doesn't provide explicit "has game today" field
      // We'll group by current lineup position and make recommendations based on performance
      
      const starters: any[] = [];
      const bench: any[] = [];
      const irPlayers: any[] = [];
      
      for (const player of players) {
        const pos = player.selected_position?.position || player.lineup_position || 'BN';
        
        if (pos === 'BN') {
          bench.push(player);
        } else if (pos === 'IR' || pos === 'IR+') {
          irPlayers.push(player);
        } else {
          starters.push(player);
        }
      }
      
      console.error(`[START ACTIVE] Starters: ${starters.length}, Bench: ${bench.length}, IR: ${irPlayers.length}`);
      
      // Generate recommendations based on performance
      const recommendations: any[] = [];
      
      // Find underperforming starters who should be benched
      // and bench players who should be started
      for (const starter of starters) {
        // Check if this starter is performing poorly
        const starterPerformance = this.calculatePlayerPerformance(starter);
        
        // Find best bench player for this position
        const eligibleBench = bench.filter(b => 
          this.isPositionEligible(b, starter.selected_position?.position || starter.primary_position)
        );
        
        for (const benchPlayer of eligibleBench) {
          const benchPerformance = this.calculatePlayerPerformance(benchPlayer);
          
          // If bench player significantly outperforms starter, recommend swap
          if (benchPerformance > starterPerformance + 1.0) { // +1.0 threshold to avoid churn
            recommendations.push({
              type: 'SWAP',
              priority: 'HIGH',
              bench_player: {
                player_key: benchPlayer.player_key,
                name: benchPlayer.name,
                position: benchPlayer.primary_position,
                performance_score: benchPerformance,
                recent_stats: benchPlayer.recent_stats,
              },
              starter_player: {
                player_key: starter.player_key,
                name: starter.name,
                position: starter.selected_position?.position || starter.primary_position,
                performance_score: starterPerformance,
                recent_stats: starter.recent_stats,
              },
              rationale: `${benchPlayer.name} (score: ${benchPerformance.toFixed(1)}) is performing significantly better than ${starter.name} (score: ${starterPerformance.toFixed(1)})`,
              changes: [
                {
                  player_key: benchPlayer.player_key,
                  current_position: 'BN',
                  recommended_position: starter.selected_position?.position || starter.primary_position,
                },
                {
                  player_key: starter.player_key,
                  current_position: starter.selected_position?.position || starter.primary_position,
                  recommended_position: 'BN',
                },
              ],
            });
            break; // Only recommend one swap per starter
          }
        }
      }
      
      console.error(`[START ACTIVE] Generated ${recommendations.length} recommendations`);
      
      // Build response
      const response: any = {
        status: 'SUCCESS',
        team_key: teamKey,
        league_key: leagueKey,
        lock_type: lockType,
        target_date: targetDate,
        target_week: targetWeek,
        roster_summary: {
          total_players: players.length,
          starters: starters.length,
          bench: bench.length,
          ir: irPlayers.length,
        },
        recommendations,
        auto_execute: options.autoExecute || false,
      };
      
      // If autoExecute is true, apply the changes
      if (options.autoExecute && recommendations.length > 0) {
        console.error(`[START ACTIVE] Auto-executing ${recommendations.length} recommendations...`);
        
        try {
          // Build player changes array for edit_team_roster
          const playerChanges: any[] = [];
          
          for (const rec of recommendations) {
            if (rec.type === 'SWAP' && rec.changes) {
              for (const change of rec.changes) {
                playerChanges.push({
                  playerKey: change.player_key,
                  position: change.recommended_position,
                });
              }
            }
          }
          
          // Execute the roster changes
          const editOptions: any = {};
          if (targetDate) {
            editOptions.date = targetDate;
            editOptions.coverageType = 'date';
          }
          if (targetWeek) {
            editOptions.week = targetWeek;
            if (!editOptions.coverageType) {
              editOptions.coverageType = 'week';
            }
          }
          
          await this.ensureIrComplianceForRosterEdit(leagueKey, teamKey, playerChanges, editOptions);
          
          const result = await this.client.editTeamRoster(
            leagueKey,
            teamKey,
            playerChanges,
            editOptions
          );
          
          response.execution_result = {
            success: true,
            message: `Successfully executed ${playerChanges.length} lineup changes`,
            result,
          };
          
          console.error(`[START ACTIVE] Execution successful`);
        } catch (error: any) {
          console.error(`[START ACTIVE] Execution failed:`, error);
          response.execution_result = {
            success: false,
            error: error.message,
            message: 'Failed to execute lineup changes',
          };
        }
      }
      
      return response;
    } catch (error: any) {
      console.error(`[START ACTIVE] Error:`, error);
      throw new Error(`START ACTIVE PLAYERS failed: ${error.message}`);
    }
  }

  /**
   * Calculate a simple performance score for a player based on recent stats
   */
  private calculatePlayerPerformance(player: any): number {
    // If no recent stats, return low score
    if (!player.recent_stats) {
      return 0;
    }
    
    // Try to extract numeric stats from recent_stats
    // This is a simple heuristic - adjust based on league scoring
    let score = 0;
    const stats = player.recent_stats;
    
    // Look for common stat fields (points, goals, assists, etc.)
    if (stats.points) score += parseFloat(stats.points) || 0;
    if (stats.goals) score += (parseFloat(stats.goals) || 0) * 2; // Weight goals higher
    if (stats.assists) score += (parseFloat(stats.assists) || 0) * 1.5;
    if (stats.shots) score += (parseFloat(stats.shots) || 0) * 0.1;
    if (stats.hits) score += (parseFloat(stats.hits) || 0) * 0.1;
    if (stats.blocks) score += (parseFloat(stats.blocks) || 0) * 0.1;
    
    return score;
  }

  /**
   * Check if a player is eligible for a specific position
   */
  private isPositionEligible(player: any, targetPosition: string): boolean {
    if (!targetPosition || targetPosition === 'BN' || targetPosition === 'IR' || targetPosition === 'IR+') {
      return true; // Anyone can be benched or IR'd
    }
    
    // Check primary position
    if (player.primary_position === targetPosition) {
      return true;
    }
    
    // Check eligible positions
    if (player.eligible_positions && Array.isArray(player.eligible_positions)) {
      return player.eligible_positions.includes(targetPosition);
    }
    
    // Check for UTIL/FLEX positions (usually accept any skater)
    if (targetPosition === 'UTIL' || targetPosition === 'FLEX') {
      return true;
    }
    
    return false;
  }

  /**
   * Helper method to extract league key from team key
   * Team key format: "gameId.l.leagueId.t.teamId"
   * League key format: "gameId.l.leagueId"
   */
  private extractLeagueKeyFromTeamKey(teamKey: string): string {
    const parts = teamKey.split('.');
    if (parts.length >= 3 && parts[1] === 'l') {
      return `${parts[0]}.${parts[1]}.${parts[2]}`;
    }
    throw new Error(`Invalid team key format: ${teamKey}`);
  }

  /**
   * Helper method to get the current week from league settings
   * This ensures we're always using the league's actual current week
   */
  private async getCurrentWeek(leagueKey: string): Promise<string | undefined> {
    try {
      const leagueSettings = await this.client.getLeagueSettings(leagueKey);
      const leagueArray = Array.isArray((leagueSettings as any)?.league) 
        ? (leagueSettings as any).league 
        : [];
      const leagueMeta = leagueArray[0] ?? {};
      return leagueMeta.current_week;
    } catch (error) {
      console.error(`[getCurrentWeek] Failed to fetch current week for ${leagueKey}:`, error);
      return undefined;
    }
  }

  private async buildTeamContext(
    leagueKey: string,
    teamKey: string,
    options?: { week?: string }
  ): Promise<any> {
    console.error(`[buildTeamContext] Called with leagueKey=${leagueKey}, teamKey=${teamKey}, week=${options?.week || 'current'}`);
    
    // First, fetch league settings to get current_week
    console.error(`[Progress] 1/4 Fetching league settings...`);
    const leagueSettingsRaw = await this.client.getLeagueSettings(leagueKey);
    console.error(`[Progress] ✓ League settings fetched`);

    // Extract current_week from league settings
    const leagueArray = Array.isArray((leagueSettingsRaw as any)?.league) ? (leagueSettingsRaw as any).league : [];
    const leagueMeta = leagueArray[0] ?? {};
    const currentWeek = leagueMeta.current_week;
    
    // Use provided week, or fall back to current_week from league settings
    const targetWeek = options?.week || currentWeek;
    console.error(`[Progress] Using week: ${targetWeek || 'default (current)'}`);

    // Now fetch remaining data in parallel with correct week
    console.error(`[Progress] 2/4 Fetching team metadata...`);
    const teamPromise = this.client.getTeam(teamKey).then(result => {
      console.error(`[Progress] ✓ Team metadata fetched`);
      return result;
    });
    
    console.error(`[Progress] 2b/4 Fetching team roster with lineup positions...`);
    // Use makeRequest directly to get raw response with roster structure
    // For daily lock leagues, use date parameter; for weekly leagues, use week parameter
    const isDaily = leagueMeta.weekly_deadline === 'intraday';
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const rosterParam = isDaily ? `;date=${today}` : (targetWeek ? `;week=${targetWeek}` : '');
    console.error(`[Progress] Roster param: ${rosterParam} (isDaily: ${isDaily})`);
    const rosterPromise = this.client['makeRequest']<any>('GET', `/team/${teamKey}/roster${rosterParam}`).then(result => {
      console.error(`[Progress] ✓ Team roster fetched`);
      return result;
    });

    console.error(`[Progress] 3/4 Fetching scoreboard...`);
    const scoreboardPromise = this.client.getLeagueScoreboard(leagueKey, targetWeek).then(result => {
      console.error(`[Progress] ✓ Scoreboard fetched`);
      return result;
    });

    console.error(`[Progress] 4/4 Fetching matchups...`);
    const matchupsPromise = this.client.getTeamMatchups(teamKey, targetWeek).then(result => {
      console.error(`[Progress] ✓ Matchups fetched`);
      return result;
    });

    const [teamMetadata, rosterResult, scoreboardResult, teamMatchupsResult] = await Promise.all([
      teamPromise,
      rosterPromise,
      scoreboardPromise,
      matchupsPromise,
    ]);

    console.error(`[Progress] Processing results...`);

    // leagueArray and leagueMeta already extracted above after fetching league settings
    const settingsSection = leagueArray.find((entry: any) => entry?.settings)?.settings ?? [];
    const primarySettings = Array.isArray(settingsSection) ? settingsSection[0] ?? {} : {};

    const rosterSummary = this.parseRosterPositionsSummary(primarySettings.roster_positions);
    const statCategoryMeta = this.buildStatCategoryMeta(primarySettings.stat_categories?.stats);
    const statCategories = statCategoryMeta.order.map((statId: string) => {
      const meta = statCategoryMeta.map.get(statId);
      return meta?.displayName || meta?.abbreviation || meta?.name || statId;
    });

    // Parse team metadata from team endpoint
    const teamArray = Array.isArray((teamMetadata as any)?.team) ? (teamMetadata as any).team : [];
    const teamMetaArray = Array.isArray(teamArray[0]) ? teamArray[0] : [];
    const teamMeta = this.flattenYahooObjectArray(teamMetaArray);
    
    // Parse players from roster endpoint (includes lineup positions)
    const players = this.parseTeamPlayers(rosterResult);
    const irNonCompliantPlayers = this.findIrNonCompliantPlayers(players);

    const totalSpots = rosterSummary.total || players.length;
    const availableSpots = Math.max(totalSpots - players.length, 0);

    const weeklyAddsLimit = primarySettings.max_weekly_adds ? Number(primarySettings.max_weekly_adds) : null;
    const weeklyAddsUsed = teamMeta.roster_adds?.value ? Number(teamMeta.roster_adds.value) : null;
    const weeklyAddsRemaining =
      weeklyAddsLimit !== null && weeklyAddsUsed !== null
        ? Math.max(weeklyAddsLimit - weeklyAddsUsed, 0)
        : null;

    const filledPositions = this.summarizeFilledPositions(players);
    
    // Count bench and IR players
    let benchCount = 0;
    let irCount = 0;
    let startersCount = 0;
    for (const player of players) {
      const lineupPos = player.lineup_position;
      if (lineupPos === 'BN') {
        benchCount++;
      } else if (this.isIrDesignatedSlot(lineupPos)) {
        irCount++;
      } else if (lineupPos && lineupPos !== 'BN') {
        startersCount++;
      }
    }

    const scoreboardMatchup = this.findMatchupForTeam(teamKey, scoreboardResult.matchups, statCategoryMeta);
    const teamMatchup = this.findMatchupForTeam(teamKey, teamMatchupsResult.matchups, statCategoryMeta);
    const chosenMatchup = scoreboardMatchup || teamMatchup;

    const irNonCompliantCount = irNonCompliantPlayers.length;
    const irLabel = irNonCompliantCount === 1 ? 'player' : 'players';
    const recommendationsActionRequired = irNonCompliantCount > 0 || availableSpots > 0;
    const recommendationsPriority = irNonCompliantCount > 0
      ? `Move ${irNonCompliantCount} healthy ${irLabel} out of IR`
      : availableSpots > 0
        ? `Fill ${availableSpots} open roster spots`
        : 'Monitor roster composition';
    const managerReadyForExecution =
      irNonCompliantCount > 0
        ? false
        : weeklyAddsRemaining !== null
          ? weeklyAddsRemaining > 0
          : null;
    const managerBlockers = irNonCompliantCount > 0 ? ['IR_NON_COMPLIANT'] : [];

    // currentWeek was already extracted from leagueMeta above; convert to number for display
    const currentWeekFormatted = Number(currentWeek || chosenMatchup?.week || 0) || null;

    const errors: string[] = [];
    if (!players.length) {
      errors.push('Team roster returned zero players from Yahoo API.');
    }
    if (!scoreboardResult.matchups.length) {
      errors.push('League scoreboard returned no current matchups.');
    }
    if (irNonCompliantPlayers.length) {
      const offenderNames = irNonCompliantPlayers
        .map((player) => player.name || player.player_key || 'Unknown player')
        .join(', ');
      errors.push(`IR compliance required: move healthy ${irLabel} out of IR slots before making transactions. Offenders: ${offenderNames}.`);
    }

    const dataComplete = Boolean(players.length && statCategories.length && scoreboardResult.matchups.length);

    console.error(`[buildTeamContext] Completed successfully. players=${players.length}, dataComplete=${dataComplete}`);
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
          starters: startersCount,
          bench: benchCount,
          ir: irCount,
        },
        ir_non_compliant_players: irNonCompliantPlayers,
      },
      current_matchup: {
        week: chosenMatchup?.week ?? currentWeekFormatted,
        opponent: chosenMatchup?.opponent ?? null,
        scores: chosenMatchup?.scores ?? null,
        status: chosenMatchup?.status ?? (scoreboardMatchup ? 'in_progress' : 'not_started'),
      },
      validation: {
        all_keys_valid: Boolean((leagueMeta.league_key || leagueKey) && (teamMeta.team_key || teamKey)),
        data_complete: dataComplete,
        errors,
        ir_non_compliant_players: irNonCompliantPlayers,
      },
      for_agent: {
        recommendations_agent: {
          action_required: recommendationsActionRequired,
          priority: recommendationsPriority,
        },
        manager_agent: {
          transaction_capacity: weeklyAddsRemaining,
          ready_for_execution: managerReadyForExecution,
          blockers: managerBlockers.length ? managerBlockers : undefined,
        },
      },
    };
  }

  private flattenYahooObjectArray(items: any[]): Record<string, any> {
    const result: Record<string, any> = {};

    if (!items || !Array.isArray(items)) {
      return result;
    }

    const addEntries = (obj: any): void => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return;
      }
      for (const [key, value] of Object.entries(obj)) {
        if (result[key] === undefined) {
          result[key] = value;
        }
      }
    };

    // Handle Format 2: [{ "0": {...}, "1": {...}, extra: ... }]
    if (items.length === 1 && typeof items[0] === 'object' && !Array.isArray(items[0])) {
      const firstItem = items[0];
      const keys = Object.keys(firstItem);
      const numericKeys = keys.filter((k) => /^\d+$/.test(k));

      if (numericKeys.length > 0) {
        for (const key of numericKeys.sort((a, b) => Number(a) - Number(b))) {
          addEntries(firstItem[key]);
        }
        for (const key of keys) {
          if (!/^\d+$/.test(key) && result[key] === undefined) {
            result[key] = firstItem[key];
          }
        }
        if (Object.keys(result).length > 0) {
          return result;
        }
      }
    }

    // Handle Format 1: [ [{...}, {...}], {...}, ... ]
    let consumedPrimaryArray = false;
    if (items.length > 0 && Array.isArray(items[0])) {
      consumedPrimaryArray = true;
      for (const nested of items[0]) {
        addEntries(nested);
      }
    }

    const startIndex = consumedPrimaryArray ? 1 : 0;
    for (let i = startIndex; i < items.length; i++) {
      const item = items[i];
      if (Array.isArray(item)) {
        for (const nested of item) {
          addEntries(nested);
        }
        continue;
      }
      addEntries(item);
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
    
    // Check for roster structure first (from /roster endpoint): roster["0"].players
    const rosterEntry = teamArray.find((entry: any) => entry?.roster);
    if (rosterEntry && rosterEntry.roster && rosterEntry.roster["0"] && rosterEntry.roster["0"].players) {
      const playersContainer = rosterEntry.roster["0"].players;
      return this.parsePlayersFromContainer(playersContainer);
    }
    
    // Fallback: look for direct players property (from ;out=players)
    const playersContainerEntry = teamArray.find((entry: any) => entry?.players);
    const playersContainer = playersContainerEntry?.players;
    if (!playersContainer || typeof playersContainer !== 'object') {
      return [];
    }

    return this.parsePlayersFromContainer(playersContainer);
  }

  private parsePlayersFromContainer(playersContainer: any): any[] {
    const players: any[] = [];
    for (const key in playersContainer) {
      if (key === 'count') continue;
      
      const entry = playersContainer[key];
      if (!entry || typeof entry !== 'object') {
        continue;
      }
      
      const playerEntryArray = entry.player;
      if (!Array.isArray(playerEntryArray)) {
        continue;
      }
      
      // Debug: Show raw player structure before flattening
      const flattened = this.flattenYahooObjectArray(playerEntryArray);

      const eligibility = Array.isArray(flattened.eligible_positions)
        ? flattened.eligible_positions.map((pos: any) => pos?.position).filter(Boolean)
        : [];
      const eligibleToAdd = Array.isArray(flattened.eligible_positions_to_add)
        ? flattened.eligible_positions_to_add.map((pos: any) => pos?.position).filter(Boolean)
        : [];

      let lineupPosition: string | null = null;
      const selectedPositionRaw = flattened.selected_position;

      if (Array.isArray(selectedPositionRaw)) {
        const selectedPosFlattened = this.flattenYahooObjectArray(selectedPositionRaw);
        lineupPosition = selectedPosFlattened.position || selectedPosFlattened.slot || null;
      } else if (selectedPositionRaw && typeof selectedPositionRaw === 'object') {
        lineupPosition = selectedPositionRaw.position || selectedPositionRaw.slot || null;
      }

      const status = this.normalizeStatusCode(
        flattened.status ??
          flattened.player_status ??
          flattened.player_status_short ??
          flattened.fantasy_status
      );
      const injuryStatus = this.normalizeStatusCode(
        flattened.injury_status ??
          flattened.status ??
          flattened.player_status ??
          flattened.roster_status
      );
      const statusFull = this.normalizeStatusText(
        flattened.status_full ??
          flattened.status_full_text ??
          flattened.player_status_full ??
          flattened.injury_status_full
      );
      const injuryNote = this.normalizeStatusText(flattened.injury_note ?? flattened.injury_notes);
      const onDisabledList = this.normalizeBooleanFlag(
        flattened.on_disabled_list ??
          flattened.on_disabled ??
          flattened.disabled_list ??
          flattened.disabled
      );
      const irEligible = this.normalizeBooleanFlag(
        flattened.ir_eligible ?? flattened.is_ir_eligible ?? flattened.ir_flag
      );

      players.push({
        player_key: flattened.player_key || null,
        name: flattened.name?.full || null,
        position: flattened.display_position || flattened.primary_position || null,
        team: flattened.editorial_team_abbr || flattened.editorial_team_full_name || null,
        lineup_position: lineupPosition,
        injury_status: injuryStatus || status,
        status,
        status_full: statusFull,
        injury_note: injuryNote,
        on_disabled_list: onDisabledList,
        ir_eligible: irEligible,
        eligibility,
        eligible_positions_to_add: eligibleToAdd,
      });
    }
    return players;
  }

  private normalizeStatusCode(value: any): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const str = String(value).trim();
    if (!str) {
      return null;
    }
    return str.toUpperCase();
  }

  private normalizeStatusText(value: any): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const str = String(value).trim();
    return str || null;
  }

  private normalizeBooleanFlag(value: any): boolean {
    if (value === undefined || value === null) {
      return false;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    const str = String(value).trim().toLowerCase();
    return str === '1' || str === 'true' || str === 'yes' || str === 'y';
  }

  private isIrDesignatedSlot(position: string | null): boolean {
    if (!position) {
      return false;
    }
    const normalized = position.trim().toUpperCase();
    return normalized.startsWith('IR') || normalized.startsWith('IL') || normalized.startsWith('DL');
  }

  private isPlayerConsideredInjured(player: any): boolean {
    if (!player) {
      return false;
    }

    if (
      this.normalizeBooleanFlag(player.on_disabled_list) ||
      this.normalizeBooleanFlag(player.on_injured_list) ||
      this.normalizeBooleanFlag(player.disabled_list) ||
      this.normalizeBooleanFlag(player.disabled)
    ) {
      return true;
    }

    const statusCandidates: Array<string | null> = [
      player.injury_status,
      player.status,
      player.status_full,
      player.injury_note,
    ];

    const meaningfulTokens = statusCandidates
      .map((token) => (typeof token === 'string' ? token.trim().toLowerCase() : ''))
      .filter((token) => token.length > 0);

    if (meaningfulTokens.length === 0) {
      return false;
    }

    const nonInjuryTokens = new Set(['active', 'a', 'healthy', 'none', 'ok']);
    const informativeTokens = meaningfulTokens.filter((token) => !nonInjuryTokens.has(token));

    return informativeTokens.length > 0;
  }

  private findIrNonCompliantPlayers(players: any[]): Array<{
    player_key: string | null;
    name: string | null;
    lineup_position: string | null;
    injury_status: string | null;
    status: string | null;
    status_full: string | null;
    injury_note: string | null;
  }> {
    const nonCompliant: Array<{
      player_key: string | null;
      name: string | null;
      lineup_position: string | null;
      injury_status: string | null;
      status: string | null;
      status_full: string | null;
      injury_note: string | null;
    }> = [];

    for (const player of players) {
      if (!this.isIrDesignatedSlot(player?.lineup_position || null)) {
        continue;
      }
      if (this.isPlayerConsideredInjured(player)) {
        continue;
      }
      nonCompliant.push({
        player_key: player.player_key ?? null,
        name: player.name ?? null,
        lineup_position: player.lineup_position ?? null,
        injury_status: player.injury_status ?? null,
        status: player.status ?? null,
        status_full: player.status_full ?? null,
        injury_note: player.injury_note ?? null,
      });
    }

    return nonCompliant;
  }

  private async loadRosterPlayersForCompliance(
    leagueKey: string,
    teamKey: string,
    coverageOptions?: { date?: string; week?: string | number; coverageType?: 'date' | 'week' }
  ): Promise<any[]> {
    const leagueSettingsRaw = await this.client.getLeagueSettings(leagueKey);
    const leagueArray = Array.isArray((leagueSettingsRaw as any)?.league)
      ? (leagueSettingsRaw as any).league
      : [];
    const leagueMeta = leagueArray[0] ?? {};
    const currentWeek = leagueMeta.current_week;
    const isDaily = leagueMeta.weekly_deadline === 'intraday';
    const today = new Date().toISOString().split('T')[0];

    const resolvedCoverageType = coverageOptions?.coverageType
      ? coverageOptions.coverageType
      : coverageOptions?.date
        ? 'date'
        : coverageOptions?.week !== undefined
          ? 'week'
          : isDaily
            ? 'date'
            : 'week';

    let rosterParam = '';
    if (resolvedCoverageType === 'date') {
      const targetDate = coverageOptions?.date || today;
      rosterParam = targetDate ? `;date=${targetDate}` : '';
    } else if (resolvedCoverageType === 'week') {
      const targetWeek = coverageOptions?.week ?? currentWeek;
      rosterParam = targetWeek ? `;week=${targetWeek}` : '';
    }

    const rosterResult = await this.client['makeRequest']<any>('GET', `/team/${teamKey}/roster${rosterParam}`);
    return this.parseTeamPlayers(rosterResult);
  }

  private async ensureIrCompliance(leagueKey: string, teamKey: string): Promise<void> {
    const players = await this.loadRosterPlayersForCompliance(leagueKey, teamKey);
    const nonCompliant = this.findIrNonCompliantPlayers(players);
    if (nonCompliant.length === 0) {
      return;
    }

    const offenderSummary = nonCompliant
      .map((player) => player.name || player.player_key || 'Unknown player')
      .join(', ');
    const label = nonCompliant.length === 1 ? 'player' : 'players';

    throw new RosterConstraintError(
      `IR compliance required: move healthy ${label} out of IR slots before making additional transactions. Offending ${label}: ${offenderSummary}.`,
      'ir_non_compliant',
      undefined,
      nonCompliant[0]?.player_key ?? undefined
    );
  }

  private async ensureIrComplianceForRosterEdit(
    leagueKey: string,
    teamKey: string,
    playerChanges: Array<{ playerKey?: string; player_key?: string; position?: string }>,
    coverageOptions?: { date?: string; week?: string | number; coverageType?: 'date' | 'week' }
  ): Promise<void> {
    const players = await this.loadRosterPlayersForCompliance(leagueKey, teamKey, coverageOptions);
    const simulatedPlayers = this.applyRosterChangesForCompliance(players, playerChanges);
    const nonCompliant = this.findIrNonCompliantPlayers(simulatedPlayers);
    if (nonCompliant.length === 0) {
      return;
    }

    const offenderSummary = nonCompliant
      .map((player) => player.name || player.player_key || 'Unknown player')
      .join(', ');
    const label = nonCompliant.length === 1 ? 'player' : 'players';

    throw new RosterConstraintError(
      `IR compliance required: move healthy ${label} out of IR slots before making additional transactions. Offending ${label}: ${offenderSummary}.`,
      'ir_non_compliant',
      undefined,
      nonCompliant[0]?.player_key ?? undefined
    );
  }

  private applyRosterChangesForCompliance(
    players: any[],
    playerChanges: Array<{ playerKey?: string; player_key?: string; position?: string }>
  ): any[] {
    const playersByKey = new Map<string, any>();
    for (const player of players) {
      if (!player) continue;
      const key = player.player_key ?? player.playerKey;
      if (!key) {
        continue;
      }
      const copy: any = { ...player, player_key: key };
      if (copy.lineup_position !== undefined && copy.lineup_position !== null) {
        const trimmed = String(copy.lineup_position).trim();
        copy.lineup_position = trimmed ? trimmed.toUpperCase() : null;
      } else {
        copy.lineup_position = null;
      }
      playersByKey.set(key, copy);
    }

    if (Array.isArray(playerChanges)) {
      for (const change of playerChanges) {
        if (!change) {
          continue;
        }
        const playerKey = change.playerKey ?? change.player_key;
        if (!playerKey) {
          continue;
        }
        const positionRaw = change.position;
        let normalizedPosition: string | null = null;
        if (positionRaw !== undefined && positionRaw !== null) {
          const trimmed = String(positionRaw).trim();
          normalizedPosition = trimmed ? trimmed.toUpperCase() : null;
        }

        const existing = playersByKey.get(playerKey);
        if (existing) {
          existing.lineup_position = normalizedPosition;
        } else {
          playersByKey.set(playerKey, {
            player_key: playerKey,
            name: null,
            lineup_position: normalizedPosition,
            injury_status: null,
            status: null,
            status_full: null,
            injury_note: null,
          });
        }
      }
    }

    return Array.from(playersByKey.values());
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

  private findMatchupForTeam(
    teamKey: string,
    matchups: any[],
    statCategoryMeta?: { map: Map<string, StatCategoryMeta>; order: string[] }
  ): {
    week: number | null;
    status: string | null;
    opponent: { team_key: string | null; team_name: string | null } | null;
    scores: {
      total: { your_team: number | null; opponent: number | null } | null;
      categories: Array<{
        id: string;
        name: string | null;
        display_name: string | null;
        abbreviation: string | null;
        is_lower_better: boolean;
        your_team: { value: string | number | null; numeric: number | null };
        opponent: { value: string | number | null; numeric: number | null };
        winner: 'you' | 'opponent' | 'tie' | null;
      }>;
    } | null;
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

      const selfTeam = teams.find((team) => team.team_key === teamKey) || null;
      if (!selfTeam) continue;
      const opponentTeam = teams.find((team) => team.team_key !== teamKey) || null;

      const weekValue =
        metadata.week ??
        metadata.matchup_week ??
        metadata.week_number ??
        metadata.week_start ??
        null;
      const weekNumber = weekValue ? Number(weekValue) || null : null;

      const totalScores = this.buildScorePayload(selfTeam, opponentTeam);
      const statWinnersContainer =
        metadata.stat_winners ||
        matchupEntry.find((item: any) => item?.stat_winners)?.stat_winners ||
        null;

      const categories =
        statCategoryMeta && selfTeam && opponentTeam
          ? this.buildCategoryScoreBreakdown(
              selfTeam,
              opponentTeam,
              statCategoryMeta,
              statWinnersContainer,
              teamKey,
              opponentTeam?.team_key || null
            )
          : [];

      const scoresPayload =
        totalScores !== null || categories.length
          ? {
              total: totalScores,
              categories,
            }
          : null;

      return {
        week: weekNumber,
        status: metadata.status || null,
        opponent: opponentTeam
          ? {
              team_key: opponentTeam.team_key || null,
              team_name: opponentTeam.name || null,
            }
          : null,
        scores: scoresPayload,
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
      
      // Always flatten if it's an array (Yahoo's standard structure)
      if (Array.isArray(teamEntry)) {
        teams.push(this.flattenYahooObjectArray(teamEntry));
      } else if (teamEntry && typeof teamEntry === 'object') {
        // Even if not an array, might have nested arrays in fields
        teams.push(teamEntry);
      }
    }

    return teams;
  }

  private buildCategoryScoreBreakdown(
    selfTeam: Record<string, any> | null,
    opponentTeam: Record<string, any> | null,
    statCategoryMeta: { map: Map<string, StatCategoryMeta>; order: string[] },
    statWinnersContainer: any,
    selfTeamKey: string,
    opponentTeamKey: string | null
  ): Array<{
    id: string;
    name: string | null;
    display_name: string | null;
    abbreviation: string | null;
    is_lower_better: boolean;
    your_team: { value: string | number | null; numeric: number | null };
    opponent: { value: string | number | null; numeric: number | null };
    winner: 'you' | 'opponent' | 'tie' | null;
  }> {
    if (!selfTeam || !opponentTeam) {
      return [];
    }

    const selfStats = this.parseTeamStatValues(selfTeam);
    const opponentStats = this.parseTeamStatValues(opponentTeam);
    const statWinners = this.parseStatWinners(statWinnersContainer);

    const allStatIds = new Set<string>();
    for (const id of statCategoryMeta.order) {
      allStatIds.add(id);
    }
    for (const id of Object.keys(selfStats)) {
      allStatIds.add(id);
    }
    for (const id of Object.keys(opponentStats)) {
      allStatIds.add(id);
    }
    for (const id of Object.keys(statWinners)) {
      allStatIds.add(id);
    }

    const orderedStatIds = Array.from(allStatIds).sort((a, b) => {
      const metaA = statCategoryMeta.map.get(a);
      const metaB = statCategoryMeta.map.get(b);
      const indexA = metaA?.index ?? Number.MAX_SAFE_INTEGER;
      const indexB = metaB?.index ?? Number.MAX_SAFE_INTEGER;
      if (indexA !== indexB) {
        return indexA - indexB;
      }
      return a.localeCompare(b);
    });

    const breakdown = orderedStatIds.map((statId) => {
      const meta = statCategoryMeta.map.get(statId);
      const baseIsLowerBetter = meta?.isLowerBetter ?? false;
      const yourStat = selfStats[statId] ?? { raw: null, numeric: null };
      const oppStat = opponentStats[statId] ?? { raw: null, numeric: null };
      const winnerInfo = statWinners[statId];
      const displayName = meta?.displayName ?? meta?.name ?? meta?.abbreviation ?? statId;
      const name = meta?.name ?? meta?.displayName ?? meta?.abbreviation ?? statId;
      const abbreviation = meta?.abbreviation ?? null;

      let winner: 'you' | 'opponent' | 'tie' | null = null;

      if (winnerInfo) {
        if (winnerInfo.isTie) {
          winner = 'tie';
        } else if (winnerInfo.winnerTeamKey === selfTeamKey) {
          winner = 'you';
        } else if (winnerInfo.winnerTeamKey === opponentTeamKey) {
          winner = 'opponent';
        }
      }

      if (!winner && yourStat.numeric !== null && oppStat.numeric !== null) {
        if (yourStat.numeric === oppStat.numeric) {
          winner = 'tie';
        } else if (baseIsLowerBetter) {
          winner = yourStat.numeric < oppStat.numeric ? 'you' : 'opponent';
        } else {
          winner = yourStat.numeric > oppStat.numeric ? 'you' : 'opponent';
        }
      }

      let finalIsLowerBetter = baseIsLowerBetter;

      if (
        winnerInfo &&
        winnerInfo.winnerTeamKey &&
        yourStat.numeric !== null &&
        oppStat.numeric !== null &&
        yourStat.numeric !== oppStat.numeric
      ) {
        if (winnerInfo.winnerTeamKey === selfTeamKey) {
          finalIsLowerBetter = yourStat.numeric < oppStat.numeric;
        } else if (winnerInfo.winnerTeamKey === opponentTeamKey) {
          finalIsLowerBetter = oppStat.numeric < yourStat.numeric;
        }
      } else if (
        !winnerInfo &&
        winner &&
        winner !== 'tie' &&
        yourStat.numeric !== null &&
        oppStat.numeric !== null &&
        yourStat.numeric !== oppStat.numeric
      ) {
        const winningNumeric = winner === 'you' ? yourStat.numeric : oppStat.numeric;
        const losingNumeric = winner === 'you' ? oppStat.numeric : yourStat.numeric;
        finalIsLowerBetter = winningNumeric < losingNumeric;
      }

      return {
        id: statId,
        name,
        display_name: displayName,
        abbreviation,
        is_lower_better: finalIsLowerBetter,
        your_team: {
          value: yourStat.raw,
          numeric: yourStat.numeric,
        },
        opponent: {
          value: oppStat.raw,
          numeric: oppStat.numeric,
        },
        winner,
      };
    });

    return breakdown;
  }

  private parseTeamStatValues(team: Record<string, any> | null): Record<string, ParsedStatValue> {
    if (!team) {
      return {};
    }

    const statsContainer =
      team.team_stats ??
      team.teamStats ??
      team.stats ??
      team.team_statistics ??
      null;

    if (!statsContainer) {
      return {};
    }

    const entries = this.extractStatEntries(statsContainer);
    const values: Record<string, ParsedStatValue> = {};

    for (const entry of entries) {
      if (!entry) {
        continue;
      }
      let statObj = entry.stat ?? entry;
      if (!statObj) {
        continue;
      }
      if (Array.isArray(statObj)) {
        statObj = this.flattenYahooObjectArray(statObj);
      }
      if (!statObj || typeof statObj !== 'object') {
        continue;
      }
      const statIdRaw = statObj.stat_id ?? statObj.statId ?? statObj.id;
      if (!statIdRaw) {
        continue;
      }
      const statId = String(statIdRaw);
      if (values[statId]) {
        continue;
      }
      let rawValue =
        statObj.value ??
        statObj.total ??
        statObj.points ??
        statObj.score ??
        null;
      if (rawValue === undefined) {
        rawValue = null;
      }
      const numeric = this.parseNumericValue(rawValue);
      values[statId] = {
        raw: rawValue,
        numeric,
      };
    }

    return values;
  }

  private parseStatWinners(statWinnersContainer: any): Record<string, { winnerTeamKey: string | null; isTie: boolean }> {
    const winners: Record<string, { winnerTeamKey: string | null; isTie: boolean }> = {};
    if (!statWinnersContainer) {
      return winners;
    }

    const entries = this.extractStatEntries(statWinnersContainer);
    for (const entry of entries) {
      if (!entry) {
        continue;
      }
      let winnerObj = entry.stat_winner ?? entry.stat ?? entry;
      if (!winnerObj) {
        continue;
      }
      if (Array.isArray(winnerObj)) {
        winnerObj = this.flattenYahooObjectArray(winnerObj);
      }
      if (!winnerObj || typeof winnerObj !== 'object') {
        continue;
      }
      const statIdRaw = winnerObj.stat_id ?? winnerObj.statId ?? winnerObj.id;
      if (!statIdRaw) {
        continue;
      }
      const statId = String(statIdRaw);
      const winnerTeamKey = winnerObj.winner_team_key ?? winnerObj.winnerTeamKey ?? null;
      const isTie =
        winnerObj.is_tie === '1' ||
        winnerObj.is_tie === 1 ||
        winnerObj.result === 'tie' ||
        (!winnerTeamKey && winnerObj.is_tie !== undefined);
      winners[statId] = {
        winnerTeamKey: winnerTeamKey ? String(winnerTeamKey) : null,
        isTie,
      };
    }

    return winners;
  }

  private buildStatCategoryMeta(statsRaw: any): { map: Map<string, StatCategoryMeta>; order: string[] } {
    const map = new Map<string, StatCategoryMeta>();
    const order: string[] = [];

    if (!statsRaw) {
      return { map, order };
    }

    const entries = this.extractStatEntries(statsRaw);
    let index = 0;

    for (const entry of entries) {
      if (!entry) {
        continue;
      }
      let statObj = entry.stat ?? entry;
      if (!statObj) {
        continue;
      }
      if (Array.isArray(statObj)) {
        statObj = this.flattenYahooObjectArray(statObj);
      }
      if (!statObj || typeof statObj !== 'object') {
        continue;
      }
      const statIdRaw = statObj.stat_id ?? statObj.statId ?? statObj.id;
      if (!statIdRaw) {
        continue;
      }
      const statId = String(statIdRaw);
      if (map.has(statId)) {
        continue;
      }
      const displayName =
        statObj.display_name ??
        statObj.name ??
        statObj.abbr ??
        statObj.displayName ??
        null;
      const name = statObj.name ?? statObj.display_name ?? statObj.abbr ?? null;
      const abbreviation = statObj.abbr ?? null;
      const sortOrderRaw =
        statObj.sort_order ??
        statObj.sortOrder ??
        statObj.sort ??
        null;
      const sortOrder =
        sortOrderRaw !== undefined && sortOrderRaw !== null
          ? String(sortOrderRaw).trim().toLowerCase()
          : null;

      let isLowerBetter = false;
      if (sortOrder) {
        if (sortOrder === 'asc' || sortOrder === 'ascending') {
          isLowerBetter = true;
        } else if (sortOrder === 'desc' || sortOrder === 'descending') {
          isLowerBetter = false;
        } else {
          const numericSort = Number(sortOrder);
          if (!Number.isNaN(numericSort)) {
            if (numericSort < 0) {
              isLowerBetter = true;
            } else if (numericSort > 0) {
              isLowerBetter = false;
            } else if (numericSort === 0) {
              isLowerBetter = true;
            }
          }
        }
      }

      const reverseFlag = statObj.is_reverse ?? statObj.isReverse ?? null;
      if (reverseFlag !== undefined && reverseFlag !== null) {
        const reverse = String(reverseFlag).trim().toLowerCase();
        if (reverse === '1' || reverse === 'true') {
          isLowerBetter = !isLowerBetter;
        }
      }

      const normalizedName = (displayName || name || abbreviation || '').toLowerCase();
      if (!isLowerBetter) {
        if (
          normalizedName.includes('against') ||
          normalizedName.includes('allowed') ||
          normalizedName.includes('against average') ||
          normalizedName.includes('gaa') ||
          normalizedName.includes('era') ||
          normalizedName.includes('whip') ||
          normalizedName.includes('pim') ||
          normalizedName.includes('penalty minutes') ||
          normalizedName.includes('turnover') ||
          normalizedName.includes('errors')
        ) {
          isLowerBetter = true;
        }
      }

      map.set(statId, {
        id: statId,
        name: name ? String(name) : null,
        displayName: displayName ? String(displayName) : null,
        abbreviation: abbreviation ? String(abbreviation) : null,
        isLowerBetter,
        index,
      });
      order.push(statId);
      index += 1;
    }

    return { map, order };
  }

  private extractStatEntries(container: any): any[] {
    if (!container) {
      return [];
    }

    if (Array.isArray(container)) {
      const collected: any[] = [];
      for (const item of container) {
        if (!item) {
          continue;
        }
        if (typeof item === 'object') {
          if (item.stat || item.stat_winner || item.stat_id || item.statId) {
            collected.push(item);
          } else {
            collected.push(...this.extractStatEntries(item));
          }
        }
      }
      return collected;
    }

    if (typeof container === 'object') {
      if (container.stat || container.stat_winner || container.stat_id || container.statId) {
        return [container];
      }
      const collected: any[] = [];
      if (container.stats !== undefined) {
        collected.push(...this.extractStatEntries(container.stats));
      } else {
        for (const key of Object.keys(container)) {
          if (key === 'count') {
            continue;
          }
          collected.push(...this.extractStatEntries(container[key]));
        }
      }
      return collected;
    }

    return [];
  }

  private parseNumericValue(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
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
    
    // Try multiple field names
    let points = team.team_points || team.points || team.score || null;
    
    // If points is an array (Yahoo's nested structure), flatten it first
    if (Array.isArray(points)) {
      points = this.flattenYahooObjectArray(points);
    }
    
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

