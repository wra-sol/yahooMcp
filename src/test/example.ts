/**
 * Example usage of Yahoo Fantasy MCP Server
 * This file demonstrates how to use the various tools
 */

import { YahooFantasyMcpServer } from '../server/mcp-server.js';
import { OAuthCredentials } from '../types/index.js';

// Example credentials (replace with your actual values)
const exampleCredentials: OAuthCredentials = {
  consumerKey: 'your_consumer_key',
  consumerSecret: 'your_consumer_secret',
  accessToken: 'your_access_token',
  accessTokenSecret: 'your_access_token_secret',
  sessionHandle: 'your_session_handle',
};

async function exampleUsage() {
  // Create MCP server instance
  const mcpServer = new YahooFantasyMcpServer(exampleCredentials);
  
  // Get available tools from fantasy tools instance
  const fantasyTools = mcpServer['fantasyTools']; // Access private property for testing
  const tools = fantasyTools.getTools();
  console.log('Available tools:', tools.map((tool: any) => tool.name));
  
  // Example: Get user's NFL games
  try {
    const userGames = await fantasyTools.executeTool('get_user_games', {});
    console.log('User games:', userGames);
  } catch (error) {
    console.error('Error getting user games:', error);
  }
}

// Example tool calls that would be made through MCP
const exampleToolCalls = [
  {
    name: 'get_user_games',
    arguments: {},
    description: 'Get all fantasy games the user participates in'
  },
  {
    name: 'get_user_leagues',
    arguments: {
      gameKey: 'nfl'
    },
    description: 'Get user\'s NFL leagues'
  },
  {
    name: 'get_league_standings',
    arguments: {
      leagueKey: '414.l.123456'
    },
    description: 'Get standings for a specific league'
  },
  {
    name: 'get_free_agents',
    arguments: {
      leagueKey: '414.l.123456',
      position: 'QB',
      count: 10
    },
    description: 'Get top 10 available quarterbacks'
  },
  {
    name: 'add_player',
    arguments: {
      leagueKey: '414.l.123456',
      teamKey: '414.l.123456.t.1',
      playerKey: '414.p.12345'
    },
    description: 'Add a player to your team'
  },
  {
    name: 'get_matchup_details',
    arguments: {
      leagueKey: '414.l.123456',
      week: '5'
    },
    description: 'Get detailed matchup information for week 5 including rosters, stats, and scoring'
  },
  {
    name: 'get_matchup_details',
    arguments: {
      leagueKey: '414.l.123456',
      teamKeys: ['414.l.123456.t.1', '414.l.123456.t.2']
    },
    description: 'Get current week matchup details for specific teams'
  },
  {
    name: 'accept_trade',
    arguments: {
      leagueKey: '414.l.123456',
      transactionKey: '414.l.123456.tr.2',
      tradeNote: 'Accepting this trade, good deal!'
    },
    description: 'Accept a pending trade proposal'
  },
  {
    name: 'reject_trade',
    arguments: {
      leagueKey: '414.l.123456',
      transactionKey: '414.l.123456.tr.3',
      tradeNote: 'Not interested in this trade'
    },
    description: 'Reject a pending trade proposal'
  },
  {
    name: 'cancel_trade',
    arguments: {
      leagueKey: '414.l.123456',
      transactionKey: '414.l.123456.tr.4'
    },
    description: 'Cancel a trade proposal that you initiated'
  },
  {
    name: 'vote_on_trade',
    arguments: {
      leagueKey: '414.l.123456',
      transactionKey: '414.l.123456.tr.5',
      vote: 'allow'
    },
    description: 'Vote to allow a pending trade in the league'
  },
  {
    name: 'edit_waiver_claim',
    arguments: {
      leagueKey: '414.l.123456',
      transactionKey: '414.l.123456.w.1',
      faabBid: 15,
      priority: 1
    },
    description: 'Edit a pending waiver claim to increase FAAB bid'
  },
  {
    name: 'cancel_waiver_claim',
    arguments: {
      leagueKey: '414.l.123456',
      transactionKey: '414.l.123456.w.2'
    },
    description: 'Cancel a pending waiver claim'
  },
  {
    name: 'edit_league_settings',
    arguments: {
      leagueKey: '414.l.123456',
      settings: {
        waiverType: 'continual',
        tradeEndDate: '2024-11-15',
        tradeRejectTime: '2'
      }
    },
    description: 'Edit league settings (commissioner only) - change waiver type and trade deadline'
  },
  {
    name: 'manage_roster',
    arguments: {
      leagueKey: '414.l.123456',
      teamKey: '414.l.123456.t.5',
      action: 'add_drop',
      addPlayerKey: '414.p.12345',
      dropPlayerKey: '414.p.67890'
    },
    description: 'Manage roster for another team (commissioner only) - add/drop players'
  },
  {
    name: 'process_transaction',
    arguments: {
      leagueKey: '414.l.123456',
      transactionKey: '414.l.123456.tr.6',
      action: 'approve',
      note: 'Trade approved by commissioner'
    },
    description: 'Process pending transaction (commissioner only) - approve a trade'
  },
  {
    name: 'edit_team_roster',
    arguments: {
      leagueKey: '414.l.123456',
      teamKey: '414.l.123456.t.3',
      playerChanges: [
        { playerKey: '414.p.11111', position: 'QB' },
        { playerKey: '414.p.22222', position: 'RB' },
        { playerKey: '414.p.33333', position: 'BN' }
      ]
    },
    description: 'Edit team roster positions (commissioner only) - set player positions directly'
  }
];

export { exampleUsage, exampleToolCalls };
