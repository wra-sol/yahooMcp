# Yahoo Fantasy MCP Server - API Documentation

Complete reference for all available MCP tools and their parameters.

## Table of Contents

- [User & Game Management](#user--game-management)
- [League Management](#league-management)
- [Team Management](#team-management)
- [Player Management](#player-management)
- [Transaction Management](#transaction-management)
- [Waiver Management](#waiver-management)
- [Trade Management](#trade-management)
- [Matchup & Scoring](#matchup--scoring)
- [Commissioner Tools](#commissioner-tools)
- [Type Definitions](#type-definitions)

---

## User & Game Management

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

## League Management

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

## Team Management

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

## Player Management

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
