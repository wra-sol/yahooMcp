// Core Yahoo Fantasy API Types
export interface YahooFantasyResponse<T = any> {
  fantasy_content: {
    [key: string]: T;
  };
}

// Game Types
export interface Game {
  game_key: string;
  game_id: string;
  name: string;
  code: string;
  type: string;
  url: string;
  season: string;
  is_registration_over: string;
  is_game_over: string;
  is_offseason: string;
}

export interface GamesCollection {
  games: Game[];
  count: number;
}

// League Types
export interface League {
  league_key: string;
  league_id: string;
  name: string;
  url: string;
  logo_url?: string;
  password?: string;
  draft_status: string;
  num_teams: string;
  edit_key: string;
  weekly_deadline?: string;
  league_update_timestamp: string;
  scoring_type: string;
  league_type: string;
  renew?: string;
  renewed?: string;
  iris_group_chat_id?: string;
  allow_add_to_dl_extra_pos: string;
  is_pro_league: string;
  is_cash_league: string;
  current_week?: string;
  start_week?: string;
  start_date?: string;
  end_week?: string;
  end_date?: string;
  is_finished: string;
  managers?: Manager[];
  teams?: Team[];
  standings?: Standing[];
  scoreboard?: Matchup[];
  settings?: LeagueSettings;
}

export interface Manager {
  manager_id: string;
  nickname?: string;
  guid?: string;
  is_commissioner: string;
  is_current_login: string;
  email?: string;
  image_url?: string;
}

export interface LeagueSettings {
  draft_type: string;
  is_auction_draft: string;
  scoring_type: string;
  uses_playoff: string;
  playoff_start_week?: string;
  uses_playoff_reseeding: string;
  uses_lock_eliminated_teams: string;
  num_playoff_teams?: string;
  num_playoff_consolation_teams?: string;
  has_multiweek_championship: string;
  uses_roster_import: string;
  roster_import_deadline?: string;
  waiver_type: string;
  waiver_rule: string;
  uses_faab: string;
  draft_time?: string;
  draft_pick_time?: string;
  post_draft_players: string;
  max_teams?: string;
  waiver_time?: string;
  trade_end_date?: string;
  trade_ratify_type?: string;
  trade_reject_time?: string;
  player_pool: string;
  cant_cut_list?: string;
  is_publicly_viewable: string;
  roster_positions?: RosterPosition[];
  stat_categories?: StatCategory[];
  stat_modifiers?: StatModifier[];
  divisions?: Division[];
  pickem_enabled?: string;
  uses_fractional_points?: string;
  uses_negative_points?: string;
}

export interface RosterPosition {
  position: string;
  position_type: string;
  count: string;
}

export interface StatCategory {
  stat_id: string;
  enabled: string;
  name: string;
  display_name: string;
  sort_order: string;
  position_type?: string;
  is_only_display_stat?: string;
  is_excluded_from_display?: string;
}

export interface StatModifier {
  stat_id: string;
  value: string;
}

export interface Division {
  division_id: string;
  name: string;
}

// Team Types
export interface Team {
  team_key: string;
  team_id: string;
  name: string;
  is_owned_by_current_login: string;
  url: string;
  team_logos?: TeamLogo[];
  waiver_priority?: string;
  number_of_moves?: string;
  number_of_trades?: string;
  roster_adds?: RosterAdds;
  clinched_playoffs?: string;
  league_scoring_type?: string;
  managers?: Manager[];
  roster?: Player[];
  roster_count?: RosterCount;
  starters?: Starter[];
  starters_count?: StartersCount;
  roster_positions?: RosterPosition[];
  stat_categories?: StatCategory[];
  stats?: Stats;
  standings?: Standing[];
  matchups?: Matchup[];
  transactions?: Transaction[];
}

export interface TeamLogo {
  size: string;
  url: string;
}

export interface RosterAdds {
  coverage_type: string;
  coverage_value: string;
  value: string;
}

export interface RosterCount {
  position: string;
  count: string;
}

export interface Starter {
  position: string;
  count: string;
}

export interface StartersCount {
  starter: Starter[];
}

// Player Types
export interface Player {
  player_key: string;
  player_id: string;
  name: {
    full: string;
    first: string;
    last: string;
    ascii_first: string;
    ascii_last: string;
  };
  editorial_player_key?: string;
  editorial_team_key?: string;
  editorial_team_full_name?: string;
  editorial_team_abbr?: string;
  uniform_number?: string;
  display_position: string;
  position_type: string;
  primary_position: string;
  eligible_positions?: string[];
  has_player_notes?: string;
  player_notes_last_timestamp?: string;
  selected_position?: SelectedPosition;
  headshot?: Headshot;
  image_url?: string;
  is_undroppable?: string;
  position?: string;
  status?: string;
  status_full?: string;
  injury_note?: string;
  on_disabled_list?: string;
  player_stats?: PlayerStats;
  player_advanced_stats?: PlayerAdvancedStats;
}

export interface SelectedPosition {
  coverage_type: string;
  coverage_value: string;
  position: string;
  is_flex?: string;
}

export interface Headshot {
  url: string;
  size: string;
}

export interface PlayerStats {
  coverage_type: string;
  coverage_value: string;
  stats?: Stat[];
}

export interface PlayerAdvancedStats {
  coverage_type: string;
  coverage_value: string;
  stats?: Stat[];
}

export interface Stat {
  stat_id: string;
  value: string;
}

// Stats and Scoring Types
export interface Stats {
  coverage_type: string;
  season: string;
  stats?: Stat[];
}

// Standings Types
export interface Standing {
  team_key: string;
  team_id: string;
  name: string;
  url: string;
  team_logos?: TeamLogo[];
  waiver_priority?: string;
  number_of_moves?: string;
  number_of_trades?: string;
  clinched_playoffs?: string;
  managers?: Manager[];
  team_stats?: TeamStats;
  team_standings?: TeamStandings;
}

export interface TeamStats {
  coverage_type: string;
  season: string;
  stats?: Stat[];
}

export interface TeamStandings {
  rank: string;
  outcome_totals?: OutcomeTotals;
  points_for?: string;
  points_against?: string;
}

export interface OutcomeTotals {
  wins: string;
  losses: string;
  ties?: string;
  percentage: string;
}

// Matchup Types
export interface Matchup {
  week: string;
  week_start?: string;
  week_end?: string;
  status: string;
  is_playoffs?: string;
  is_consolation?: string;
  is_matchup_recap_available?: string;
  matchup_recap_title?: string;
  matchup_recap_url?: string;
  is_tied?: string;
  winner_team_key?: string;
  teams?: Team[];
}

// Transaction Types
export interface Transaction {
  transaction_key: string;
  transaction_id: string;
  type: string;
  status: string;
  timestamp: string;
  players?: TransactionPlayer[];
  faab_bid?: string;
  tradee_team_key?: string;
  tradee_team_name?: string;
  trader_team_key?: string;
  trader_team_name?: string;
  trade_note?: string;
  consenter_team_key?: string;
  is_league_manager?: string;
  is_pending?: string;
}

export interface TransactionPlayer {
  player_key: string;
  transaction_data?: TransactionData;
}

export interface TransactionData {
  type: string;
  source_team_key?: string;
  destination_team_key?: string;
}

// Users Collection Types
export interface User {
  guid: string;
  games?: GamesCollection;
}

export interface UsersCollection {
  users: User[];
  count: number;
}

// API Request/Response Types
export interface YahooApiError {
  description: string;
  detail?: string;
}

export interface YahooApiResponse<T = any> {
  fantasy_content: T;
  xml: {
    lang: string;
    uri: string;
    encoding: string;
    version: string;
  };
}

// OAuth Types
export interface OAuthCredentials {
  consumerKey: string;
  consumerSecret: string;
  accessToken?: string;
  accessTokenSecret?: string;
  sessionHandle?: string;
}

export interface OAuthTokenResponse {
  oauth_token: string;
  oauth_token_secret: string;
  oauth_callback_confirmed: string;
  oauth_verifier?: string;
}

export interface OAuthAccessTokenResponse {
  oauth_token: string;
  oauth_token_secret: string;
  oauth_session_handle?: string;
  oauth_authorization_expires_in?: string;
  oauth_expires_in?: string;
  xoauth_yahoo_guid?: string;
}

// Filter Types
export interface LeagueFilters {
  game_keys?: string[];
  league_keys?: string[];
  team_keys?: string[];
  player_keys?: string[];
  transaction_keys?: string[];
  draft_results?: boolean;
  draft_teams?: boolean;
  players?: boolean;
  stats?: boolean;
  standings?: boolean;
  rosters?: boolean;
  matchups?: boolean;
  scoreboard?: boolean;
  transactions?: boolean;
  settings?: boolean;
  metadata?: boolean;
  position?: string;
  status?: string;
  search?: string;
  sort?: string;
  sort_type?: string;
  sort_season?: string;
  sort_week?: string;
  count?: number;
  start?: number;
}

export interface PlayerFilters {
  position?: string;
  status?: string;
  search?: string;
  sort?: string;
  sort_type?: string;
  sort_season?: string;
  sort_week?: string;
  count?: number;
  start?: number;
}

export interface TransactionFilters {
  type?: string;
  types?: string[];
  team_key?: string;
  count?: number;
}

// MCP Tool Types
export interface McpToolInput {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface McpToolResult {
  content: Array<{
    type: string;
    text?: string;
    data?: any;
  }>;
  isError?: boolean;
}

// Utility Types
export type GameType = 'nfl' | 'mlb' | 'nba' | 'nhl';
export type TransactionType = 'add' | 'drop' | 'add/drop' | 'trade' | 'commish' | 'pending_trade' | 'waiver';
export type PositionType = 'O' | 'B' | 'P' | 'K' | 'DT' | 'DE' | 'LB' | 'DB' | 'IR' | 'PUP' | 'NA';
export type StatType = 'season' | 'lastweek' | 'lastmonth' | 'date' | 'week';
export type LeagueType = 'league' | 'roto' | 'head_to_head';
export type ScoringType = 'head' | 'roto';
