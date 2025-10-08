# Yahoo Fantasy MCP Server - API Documentation

Complete reference for all 54 available MCP tools and their parameters.

## Table of Contents

- [User & Game Management (9 tools)](#user--game-management)
- [League Management (16 tools)](#league-management)
- [Team Management (6 tools)](#team-management)
- [Player Management (8 tools)](#player-management)
- [Transaction Management (8 tools)](#transaction-management)
- [Waiver Management (3 tools)](#waiver-management)
- [Trade Management (included in Transactions)](#trade-management)
- [Commissioner Tools (4 tools)](#commissioner-tools)
- [Type Definitions](#type-definitions)

---

## User & Game Management

This section includes 9 tools for managing user accounts, game information, and user history.

### `get_user_games`

Get all fantasy games the user is participating in.

**Parameters:**
```typescript
{
  gameKeys?: string[]  // Optional: Filter by specific games (e.g., ["nfl", "mlb"])
}
```

**Example:**
```json
{
  "tool": "get_user_games",
  "arguments": {
    "gameKeys": ["nfl"]
  }
}
```

**Response:**
```typescript
{
  games: Game[];
  count: number;
}
```

---

### `get_user_leagues`

Get user's leagues for a specific game.

**Parameters:**
```typescript
{
  gameKey: string  // Required: Game key (e.g., "nfl", "mlb", "423")
}
```

**Example:**
```json
{
  "tool": "get_user_leagues",
  "arguments": {
    "gameKey": "nfl"
  }
}
```

**Response:**
```typescript
{
  leagues: League[];
  count: number;
}
```

---

### `get_user_profile`

Get the current user's profile information.

**Parameters:** None

**Example:**
```json
{
  "tool": "get_user_profile",
  "arguments": {}
}
```

**Response:**
```typescript
User {
  guid: string;
  games?: GamesCollection;
}
```

---

### `get_user_teams`

Get all teams for the current user across all games.

**Parameters:** None

**Example:**
```json
{
  "tool": "get_user_teams",
  "arguments": {}
}
```

**Response:**
```typescript
{
  teams: Team[];
  count: number;
}
```

---

### `get_league_history`

Get historical league data including past seasons standings and results.

**Parameters:**
```typescript
{
  leagueKey: string  // Required: League key for a past season (e.g., "390.l.123456" for 2019 NFL)
}
```

**Example:**
```json
{
  "tool": "get_league_history",
  "arguments": {
    "leagueKey": "390.l.123456"
  }
}
```

---

### `get_team_history`

Get historical team performance data including stats, standings, and matchups.

**Parameters:**
```typescript
{
  teamKey: string  // Required: Team key for a past season (e.g., "390.l.123456.t.1")
}
```

**Example:**
```json
{
  "tool": "get_team_history",
  "arguments": {
    "teamKey": "390.l.123456.t.1"
  }
}
```

---

## League Management

This section includes 16 tools for comprehensive league data access.

### `get_league`

Get detailed information about a specific league.

**Parameters:**
```typescript
{
  leagueKey: string;        // Required: League key (e.g., "423.l.123456")
  filters?: {               // Optional filters
    standings?: boolean;
    rosters?: boolean;
    matchups?: boolean;
    settings?: boolean;
  }
}
```

**Example:**
```json
{
  "tool": "get_league",
  "arguments": {
    "leagueKey": "423.l.123456",
    "filters": {
      "standings": true,
      "settings": true
    }
  }
}
```

---

### `get_league_settings`

Get detailed league settings and configuration.

**Parameters:**
```typescript
{
  leagueKey: string  // Required: League key
}
```

**Example:**
```json
{
  "tool": "get_league_settings",
  "arguments": {
    "leagueKey": "423.l.123456"
  }
}
```

**Response:**
```typescript
LeagueSettings {
  draft_type: string;
  scoring_type: string;
  waiver_type: string;
  waiver_rule: string;
  uses_faab: string;
  roster_positions: RosterPosition[];
  stat_categories: StatCategory[];
  // ... more settings
}
```

---

### `get_league_metadata`

Get league metadata.

**Parameters:**
```typescript
{
  leagueKey: string  // Required: League key (e.g., "414.l.123456")
}
```

**Example:**
```json
{
  "tool": "get_league_metadata",
  "arguments": {
    "leagueKey": "414.l.123456"
  }
}
```

---

### `get_league_rosters`

Get roster information for all teams in a league.

**Parameters:**
```typescript
{
  leagueKey: string  // Required: League key (e.g., "414.l.123456")
}
```

**Example:**
```json
{
  "tool": "get_league_rosters",
  "arguments": {
    "leagueKey": "414.l.123456"
  }
}
```

---

### `get_league_standings`

Get league standings.

**Parameters:**
```typescript
{
  leagueKey: string  // Required: League key
}
```

**Example:**
```json
{
  "tool": "get_league_standings",
  "arguments": {
    "leagueKey": "423.l.123456"
  }
}
```

**Response:**
```typescript
{
  standings: Standing[];
  count: number;
}
```

---

### `get_league_teams`

Get all teams in a league.

**Parameters:**
```typescript
{
  leagueKey: string;  // Required: League key
  filters?: {         // Optional filters
    stats?: boolean;
    standings?: boolean;
    rosters?: boolean;
  }
}
```

**Example:**
```json
{
  "tool": "get_league_teams",
  "arguments": {
    "leagueKey": "414.l.123456",
    "filters": { "stats": true }
  }
}
```

---

### `get_league_scoreboard`

Get league scoreboard/matchups for current or specific week.

**Parameters:**
```typescript
{
  leagueKey: string;  // Required: League key
  week?: string;      // Optional: Week number (e.g., "1", "2")
}
```

**Example:**
```json
{
  "tool": "get_league_scoreboard",
  "arguments": {
    "leagueKey": "423.l.123456",
    "week": "5"
  }
}
```

---

### `get_matchup_details`

Get detailed matchup information including rosters, stats, and scoring.

**Parameters:**
```typescript
{
  leagueKey: string;     // Required: League key
  week?: string;         // Optional: Week number
  teamKeys?: string[];   // Optional: Filter specific matchups
}
```

**Example:**
```json
{
  "tool": "get_matchup_details",
  "arguments": {
    "leagueKey": "423.l.123456",
    "week": "5",
    "teamKeys": ["423.l.123456.t.1", "423.l.123456.t.2"]
  }
}
```

---

### `get_league_stats`

Get league-wide statistics aggregated across all teams.

**Parameters:**
```typescript
{
  leagueKey: string  // Required: League key (e.g., "414.l.123456")
}
```

**Example:**
```json
{
  "tool": "get_league_stats",
  "arguments": {
    "leagueKey": "414.l.123456"
  }
}
```

---

### `get_live_scores`

Get live scoring updates for league matchups.

**Parameters:**
```typescript
{
  leagueKey: string;  // Required: League key
  week?: string;      // Optional: Week number (default: current week)
}
```

**Example:**
```json
{
  "tool": "get_live_scores",
  "arguments": {
    "leagueKey": "414.l.123456",
    "week": "5"
  }
}
```

---

### `get_game_updates`

Get real-time game updates and current state.

**Parameters:**
```typescript
{
  gameKey: string  // Required: Game key (e.g., "nfl", "mlb", "414")
}
```

**Example:**
```json
{
  "tool": "get_game_updates",
  "arguments": {
    "gameKey": "nfl"
  }
}
```

---

### `get_league_transactions`

Get league transactions (trades, adds, drops).

**Parameters:**
```typescript
{
  leagueKey: string;  // Required: League key
  filters?: {
    type?: string;           // Transaction type filter
    types?: string[];        // Multiple types
    team_key?: string;       // Filter by team
    count?: number;          // Number of results
  }
}
```

**Example:**
```json
{
  "tool": "get_league_transactions",
  "arguments": {
    "leagueKey": "414.l.123456",
    "filters": { "type": "trade", "count": 10 }
  }
}
```

---

### `get_league_players`

Get all players in a league.

**Parameters:**
```typescript
{
  leagueKey: string;  // Required: League key
  filters?: {
    position?: string;       // Position filter
    status?: string;         // Status filter
    search?: string;         // Name search
    count?: number;          // Number of results
    start?: number;          // Pagination start
  }
}
```

**Example:**
```json
{
  "tool": "get_league_players",
  "arguments": {
    "leagueKey": "414.l.123456",
    "filters": { "position": "QB", "count": 25 }
  }
}
```

---

### `get_draft_results`

Get draft results for a league.

**Parameters:**
```typescript
{
  leagueKey: string  // Required: League key
}
```

**Example:**
```json
{
  "tool": "get_draft_results",
  "arguments": {
    "leagueKey": "423.l.123456"
  }
}
```

**Response:**
```typescript
{
  draft_results: DraftResult[];
  count: number;
}
```

---

### `get_draft_teams`

Get draft team information for a league.

**Parameters:**
```typescript
{
  leagueKey: string  // Required: League key (e.g., "414.l.123456")
}
```

**Example:**
```json
{
  "tool": "get_draft_teams",
  "arguments": {
    "leagueKey": "414.l.123456"
  }
}
```

---

### `get_draft_settings`

Get draft settings and configuration for a league.

**Parameters:**
```typescript
{
  leagueKey: string  // Required: League key (e.g., "414.l.123456")
}
```

**Example:**
```json
{
  "tool": "get_draft_settings",
  "arguments": {
    "leagueKey": "414.l.123456"
  }
}
```

---

## Team Management

This section includes 6 tools for team data and roster management.

### `get_team`

Get detailed information about a specific team.

**Parameters:**
```typescript
{
  teamKey: string;    // Required: Team key (e.g., "423.l.123456.t.1")
  filters?: {
    roster?: boolean;
    matchups?: boolean;
    stats?: boolean;
  }
}
```

**Example:**
```json
{
  "tool": "get_team",
  "arguments": {
    "teamKey": "423.l.123456.t.1",
    "filters": {
      "roster": true,
      "stats": true
    }
  }
}
```

---

### `get_team_roster`

Get team roster for current or specific week.

**Parameters:**
```typescript
{
  teamKey: string;  // Required: Team key
  week?: string;    // Optional: Week number
}
```

**Example:**
```json
{
  "tool": "get_team_roster",
  "arguments": {
    "teamKey": "423.l.123456.t.1",
    "week": "5"
  }
}
```

**Response:**
```typescript
{
  players: Player[];
  count: number;
}
```

---

### `get_team_stats`

Get team statistics for season/week/date ranges.

**Parameters:**
```typescript
{
  teamKey: string;                           // Required: Team key
  statType?: 'season' | 'week' | 'lastweek' | 'lastmonth' | 'date';
  season?: string;                           // Season year (e.g., "2024")
  week?: string;                             // Week number
  date?: string;                             // Date (YYYY-MM-DD)
}
```

**Example:**
```json
{
  "tool": "get_team_stats",
  "arguments": {
    "teamKey": "423.l.123456.t.1",
    "statType": "week",
    "week": "5"
  }
}
```

---

### `get_team_context`

Build a comprehensive team context package combining league settings, roster, and matchup snapshot for AI agent use.

**Parameters:**
```typescript
{
  leagueKey: string;  // Required: League key (e.g., "465.l.27830")
  teamKey: string;    // Required: Team key (e.g., "465.l.27830.t.10")
  options?: {
    week?: string;    // Optional: Scoring week to target (defaults to current week)
  }
}
```

**Example:**
```json
{
  "tool": "get_team_context",
  "arguments": {
    "leagueKey": "465.l.27830",
    "teamKey": "465.l.27830.t.10",
    "options": { "week": "5" }
  }
}
```

**Response:**
Returns a comprehensive context object including:
- League settings (scoring type, roster positions, waiver rules)
- Current roster (all players with positions and eligibility)
- Current matchup (opponent, scores, week)
- Transaction limits (weekly adds remaining, FAAB budget)
- Validation status

This tool is optimized for AI agents that need complete team state for decision-making.

---

## Player Management

This section includes 8 tools for player search, statistics, and availability.

### `search_players`

Search for players in a specific game.

**Parameters:**
```typescript
{
  gameKey: string;  // Required: Game key
  filters?: {
    search?: string;      // Player name search
    position?: string;    // Position filter (e.g., "QB", "RB")
    status?: string;      // Player status
    count?: number;       // Number of results (max 25)
    start?: number;       // Starting index for pagination
  }
}
```

**Example:**
```json
{
  "tool": "search_players",
  "arguments": {
    "gameKey": "nfl",
    "filters": {
      "search": "mahomes",
      "position": "QB",
      "count": 10
    }
  }
}
```

---

### `get_player`

Get detailed information about a specific player.

**Parameters:**
```typescript
{
  playerKey: string  // Required: Player key (e.g., "423.p.31023")
}
```

**Example:**
```json
{
  "tool": "get_player",
  "arguments": {
    "playerKey": "423.p.31023"
  }
}
```

---

### `get_player_stats`

Get player statistics for season, week, or date.

**Parameters:**
```typescript
{
  playerKey: string;                         // Required: Player key
  statType?: 'season' | 'week' | 'lastweek' | 'lastmonth' | 'date';
  season?: string;                           // Season year
  week?: string;                             // Week number
  date?: string;                             // Date (YYYY-MM-DD)
}
```

**Example:**
```json
{
  "tool": "get_player_stats",
  "arguments": {
    "playerKey": "423.p.31023",
    "statType": "season",
    "season": "2024"
  }
}
```

---

### `get_player_ownership`

Get player ownership information within a league.

**Parameters:**
```typescript
{
  leagueKey: string;  // Required: League key
  playerKey: string;  // Required: Player key
}
```

**Example:**
```json
{
  "tool": "get_player_ownership",
  "arguments": {
    "leagueKey": "423.l.123456",
    "playerKey": "423.p.31023"
  }
}
```

---

### `get_player_notes`

Get Yahoo's editorial notes and news for a player.

**Parameters:**
```typescript
{
  playerKey: string  // Required: Player key
}
```

**Example:**
```json
{
  "tool": "get_player_notes",
  "arguments": {
    "playerKey": "423.p.31023"
  }
}
```

---

### `get_free_agents`

Get available free agents in a league.

**Parameters:**
```typescript
{
  leagueKey: string;   // Required: League key
  position?: string;   // Optional: Position filter (e.g., "QB", "RB")
  status?: string;     // Optional: Status (default: "A" for available)
  count?: number;      // Optional: Number of players (max 25, default 25)
  start?: number;      // Optional: Starting index (default 0)
}
```

**Example:**
```json
{
  "tool": "get_free_agents",
  "arguments": {
    "leagueKey": "423.l.123456",
    "position": "WR",
    "count": 25
  }
}
```

---

## Transaction Management

This section includes 8 tools for managing player transactions and trades.

### `add_player`

Add a player to your team (free agent pickup).

**Parameters:**
```typescript
{
  leagueKey: string;  // Required: League key
  teamKey: string;    // Required: Your team key
  playerKey: string;  // Required: Player key to add
}
```

**Example:**
```json
{
  "tool": "add_player",
  "arguments": {
    "leagueKey": "423.l.123456",
    "teamKey": "423.l.123456.t.1",
    "playerKey": "423.p.31023"
  }
}
```

**Response:** `Transaction` object

---

### `drop_player`

Drop a player from your team.

**Parameters:**
```typescript
{
  leagueKey: string;  // Required: League key
  teamKey: string;    // Required: Your team key
  playerKey: string;  // Required: Player key to drop
}
```

**Example:**
```json
{
  "tool": "drop_player",
  "arguments": {
    "leagueKey": "423.l.123456",
    "teamKey": "423.l.123456.t.1",
    "playerKey": "423.p.28389"
  }
}
```

---

### `add_drop_players`

Add one player and drop another in a single transaction.

**Parameters:**
```typescript
{
  leagueKey: string;       // Required: League key
  teamKey: string;         // Required: Your team key
  addPlayerKey: string;    // Required: Player key to add
  dropPlayerKey: string;   // Required: Player key to drop
  faabBid?: number;        // Optional: FAAB bid amount (if league uses FAAB)
}
```

**Example:**
```json
{
  "tool": "add_drop_players",
  "arguments": {
    "leagueKey": "423.l.123456",
    "teamKey": "423.l.123456.t.1",
    "addPlayerKey": "423.p.31023",
    "dropPlayerKey": "423.p.28389",
    "faabBid": 15
  }
}
```

---

## Waiver Management

This section includes 3 tools for managing waiver claims and priorities.

### `get_waiver_claims`

Get pending waiver claims for a specific team.

**Parameters:**
```typescript
{
  teamKey: string  // Required: Team key
}
```

**Example:**
```json
{
  "tool": "get_waiver_claims",
  "arguments": {
    "teamKey": "423.l.123456.t.1"
  }
}
```

---

### `edit_waiver_claim`

Edit a pending waiver claim (update FAAB bid or priority).

**Parameters:**
```typescript
{
  leagueKey: string;       // Required: League key
  transactionKey: string;  // Required: Waiver claim transaction key
  faabBid: number;         // Required: New FAAB bid amount
  priority?: number;       // Optional: New priority
}
```

**Example:**
```json
{
  "tool": "edit_waiver_claim",
  "arguments": {
    "leagueKey": "423.l.123456",
    "transactionKey": "423.l.123456.w.1",
    "faabBid": 25,
    "priority": 1
  }
}
```

---

### `cancel_waiver_claim`

Cancel a pending waiver claim.

**Parameters:**
```typescript
{
  leagueKey: string;       // Required: League key
  transactionKey: string;  // Required: Waiver claim transaction key
}
```

**Example:**
```json
{
  "tool": "cancel_waiver_claim",
  "arguments": {
    "leagueKey": "423.l.123456",
    "transactionKey": "423.l.123456.w.1"
  }
}
```

---

## Trade Management

### `propose_trade`

Propose a trade between two teams.

**Parameters:**
```typescript
{
  leagueKey: string;       // Required: League key
  traderTeamKey: string;   // Required: Your team key
  tradeeTeamKey: string;   // Required: Other team's key
  players: Array<{         // Required: Players involved
    playerKey: string;
    sourceTeamKey: string;
    destinationTeamKey: string;
  }>;
  tradeNote?: string;      // Optional: Note to include
}
```

**Example:**
```json
{
  "tool": "propose_trade",
  "arguments": {
    "leagueKey": "423.l.123456",
    "traderTeamKey": "423.l.123456.t.1",
    "tradeeTeamKey": "423.l.123456.t.2",
    "players": [
      {
        "playerKey": "423.p.31023",
        "sourceTeamKey": "423.l.123456.t.1",
        "destinationTeamKey": "423.l.123456.t.2"
      },
      {
        "playerKey": "423.p.28389",
        "sourceTeamKey": "423.l.123456.t.2",
        "destinationTeamKey": "423.l.123456.t.1"
      }
    ],
    "tradeNote": "Let's make a deal!"
  }
}
```

---

### `accept_trade`

Accept a pending trade proposal.

**Parameters:**
```typescript
{
  leagueKey: string;       // Required: League key
  transactionKey: string;  // Required: Trade transaction key
  tradeNote?: string;      // Optional: Note when accepting
}
```

**Example:**
```json
{
  "tool": "accept_trade",
  "arguments": {
    "leagueKey": "423.l.123456",
    "transactionKey": "423.l.123456.tr.2",
    "tradeNote": "Sounds good!"
  }
}
```

---

### `reject_trade`

Reject a pending trade proposal.

**Parameters:**
```typescript
{
  leagueKey: string;       // Required: League key
  transactionKey: string;  // Required: Trade transaction key
  tradeNote?: string;      // Optional: Note when rejecting
}
```

**Example:**
```json
{
  "tool": "reject_trade",
  "arguments": {
    "leagueKey": "423.l.123456",
    "transactionKey": "423.l.123456.tr.3",
    "tradeNote": "Not interested"
  }
}
```

---

### `cancel_trade`

Cancel a trade proposal that you initiated.

**Parameters:**
```typescript
{
  leagueKey: string;       // Required: League key
  transactionKey: string;  // Required: Trade transaction key
}
```

**Example:**
```json
{
  "tool": "cancel_trade",
  "arguments": {
    "leagueKey": "423.l.123456",
    "transactionKey": "423.l.123456.tr.4"
  }
}
```

---

### `vote_on_trade`

Vote on a pending trade (if league allows voting).

**Parameters:**
```typescript
{
  leagueKey: string;       // Required: League key
  transactionKey: string;  // Required: Trade transaction key
  vote: 'allow' | 'veto';  // Required: Your vote
}
```

**Example:**
```json
{
  "tool": "vote_on_trade",
  "arguments": {
    "leagueKey": "423.l.123456",
    "transactionKey": "423.l.123456.tr.5",
    "vote": "allow"
  }
}
```

---

## Commissioner Tools

This section includes 4 tools for league commissioners to manage league settings and transactions.

⚠️ **All commissioner tools require you to be the league commissioner.**

### `edit_league_settings`

Edit league settings (commissioner only).

**Parameters:**
```typescript
{
  leagueKey: string;  // Required: League key
  settings: {         // Required: Settings to update
    draftTime?: string;
    draftType?: string;
    isAuctionDraft?: string;
    waiverType?: string;
    waiverTime?: string;
    tradeEndDate?: string;
    tradeRejectTime?: string;
    postDraftPlayers?: string;
    maxTeams?: string;
    [key: string]: string | undefined;  // Any other settings
  }
}
```

**Example:**
```json
{
  "tool": "edit_league_settings",
  "arguments": {
    "leagueKey": "423.l.123456",
    "settings": {
      "waiverType": "continual",
      "tradeEndDate": "2024-11-15",
      "tradeRejectTime": "2"
    }
  }
}
```

---

### `manage_roster`

Manage team roster (commissioner only). Add or drop players for any team.

**Parameters:**
```typescript
{
  leagueKey: string;               // Required: League key
  teamKey: string;                 // Required: Team to manage
  action: 'add' | 'drop' | 'add_drop';  // Required: Action type
  addPlayerKey?: string;           // Required for 'add' and 'add_drop'
  dropPlayerKey?: string;          // Required for 'drop' and 'add_drop'
}
```

**Example:**
```json
{
  "tool": "manage_roster",
  "arguments": {
    "leagueKey": "423.l.123456",
    "teamKey": "423.l.123456.t.5",
    "action": "add_drop",
    "addPlayerKey": "423.p.31023",
    "dropPlayerKey": "423.p.28389"
  }
}
```

---

### `process_transaction`

Process pending transactions (commissioner only). Approve or reject trades, waiver claims, etc.

**Parameters:**
```typescript
{
  leagueKey: string;            // Required: League key
  transactionKey: string;       // Required: Transaction to process
  action: 'approve' | 'reject'; // Required: Action to take
  note?: string;                // Optional: Note explaining decision
}
```

**Example:**
```json
{
  "tool": "process_transaction",
  "arguments": {
    "leagueKey": "423.l.123456",
    "transactionKey": "423.l.123456.tr.6",
    "action": "approve",
    "note": "Trade approved by commissioner"
  }
}
```

---

### `edit_team_roster`

Edit team roster positions (commissioner only). Directly set player positions.

**Parameters:**
```typescript
{
  leagueKey: string;     // Required: League key
  teamKey: string;       // Required: Team to edit
  playerChanges: Array<{ // Required: Player position changes
    playerKey: string;
    position: string;    // e.g., "QB", "RB", "BN", "IR"
  }>;
}
```

**Example:**
```json
{
  "tool": "edit_team_roster",
  "arguments": {
    "leagueKey": "423.l.123456",
    "teamKey": "423.l.123456.t.3",
    "playerChanges": [
      { "playerKey": "423.p.11111", "position": "QB" },
      { "playerKey": "423.p.22222", "position": "RB" },
      { "playerKey": "423.p.33333", "position": "BN" }
    ]
  }
}
```

---

## Type Definitions

### Common Position Codes

| Position | Description |
|----------|-------------|
| `QB` | Quarterback |
| `RB` | Running Back |
| `WR` | Wide Receiver |
| `TE` | Tight End |
| `K` | Kicker |
| `DEF` | Team Defense |
| `BN` | Bench |
| `IR` | Injured Reserve |
| `FLEX` | Flex Position |
| `OP` | Offensive Player (Super Flex) |

### Transaction Types

| Type | Description |
|------|-------------|
| `add` | Add a free agent |
| `drop` | Drop a player |
| `add/drop` | Add and drop in one transaction |
| `trade` | Completed trade |
| `pending_trade` | Pending trade proposal |
| `waiver` | Waiver claim |
| `commish` | Commissioner action |

### Status Codes

| Status | Description |
|--------|-------------|
| `A` | Available (Free Agent) |
| `FA` | Free Agent only |
| `W` | On Waivers |
| `T` | Taken (rostered) |
| `NA` | Not Available |

---

## Rate Limiting

Yahoo Fantasy API has rate limits. Best practices:

- Cache frequently accessed data
- Batch requests when possible
- Implement exponential backoff for retries
- Monitor for 429 (Too Many Requests) errors

---

## Need Help?

- [Main README](README.md)
- [Yahoo API Documentation](https://developer.yahoo.com/fantasysports/guide/)
- [Example Usage](src/test/example.ts)
