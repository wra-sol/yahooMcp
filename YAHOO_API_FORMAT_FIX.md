# Yahoo API Format Fix

## Problem 1: JSON Parsing Errors (GET Requests)
When calling MCP tools for data retrieval, you were getting:
```json
{
  "error": {
    "code": -32603,
    "message": "Tool execution failed: API request failed: Failed to parse JSON"
  }
}
```

### Root Cause
The API client had a critical mismatch for GET requests:

**Before (BROKEN):**
```typescript
headers: {
  'Content-Type': 'application/xml',  // ← Requesting XML
  'Accept': 'application/xml',        // ← Expecting XML
  ...
}
...
const responseData = await response.json();  // ← But parsing as JSON! ❌
```

**The Issue:**
1. Yahoo Fantasy API returns **XML** by default
2. We were requesting XML (`Accept: application/xml`)
3. But trying to parse it as JSON (`.json()`)
4. This caused "Failed to parse JSON" errors

### Solution for GET Requests
Yahoo Fantasy API supports JSON format via the `?format=json` query parameter!

**After (FIXED):**
```typescript
// Add ?format=json to all requests
const separator = endpoint.includes('?') ? '&' : '?';
const url = `${this.baseUrl}${endpoint}${separator}format=json`;

headers: {
  'Content-Type': 'application/json',  // ← Request JSON
  'Accept': 'application/json',        // ← Expect JSON
  ...
}
...
const responseData = JSON.parse(responseText);  // ← Parse JSON ✅
```

## Problem 2: Transaction Failures (POST Requests)
When attempting roster modifications (add/drop players, lineup changes), you were getting:
```json
{
  "error": {
    "code": -32603,
    "message": "Tool execution failed: API request failed: HTTP 415: Unsupported Media Type - unsupported content type application/json . only application/xml supported"
  }
}
```

### Root Cause
Yahoo Fantasy API has different requirements for POST requests:

**Before (BROKEN):**
```typescript
// Built XML data correctly
const xmlData = this.buildAddPlayerXML(playerKey, teamKey);

// But sent with wrong Content-Type
headers: {
  'Content-Type': 'application/json',  // ← WRONG for XML data!
  'Accept': 'application/json',
  ...
}

fetchOptions.body = xmlData;  // XML body with JSON header ❌
```

**The Issue:**
1. Transaction methods correctly build XML request bodies
2. But `Content-Type` header was hardcoded to `application/json`
3. Yahoo API rejects JSON Content-Type when receiving XML data
4. All roster modifications failed with 415 errors

### Solution for POST Requests
Detect XML data and set appropriate Content-Type:

**After (FIXED):**
```typescript
// Detect if data is XML (starts with <?xml)
const isXmlData = typeof data === 'string' && data.trim().startsWith('<?xml');

const fetchOptions: RequestInit = {
  method,
  headers: {
    ...authHeader,
    // Yahoo API requires application/xml for POST requests with XML data
    // But we can still request JSON response via ?format=json
    'Content-Type': isXmlData ? 'application/xml' : 'application/json',
    'Accept': 'application/json',
  },
};

if (data && method === 'POST') {
  fetchOptions.body = data;  // XML body with XML header ✅
}
```

## Key Improvements Made

### 1. Request JSON Responses (All Requests)
```typescript
const url = `${this.baseUrl}${endpoint}${separator}format=json`;
```
This adds `?format=json` or `&format=json` to every API request, ensuring we get JSON responses back.

### 2. Dynamic Content-Type Headers (POST Requests)
```typescript
const isXmlData = typeof data === 'string' && data.trim().startsWith('<?xml');

const fetchOptions: RequestInit = {
  headers: {
    'Content-Type': isXmlData ? 'application/xml' : 'application/json',
    'Accept': 'application/json',
  },
};
```
Automatically detects XML data and sets the correct Content-Type header.

### 3. Better Error Handling
Shows actual response content when parsing fails:
```typescript
if (!contentType?.includes('application/json') && !responseText.trim().startsWith('{')) {
  console.error('⚠️  Received non-JSON response:');
  console.error('   Content-Type:', contentType);
  console.error('   Response preview:', responseText.substring(0, 200));
  throw new Error(`Expected JSON but received ${contentType}`);
}
```

### 4. Enhanced Error Messages
Captures error response bodies with proper formatting:
```typescript
const errorText = await response.text();
if (contentType?.includes('application/json')) {
  const errorData = JSON.parse(errorText);
  errorMessage += ` - ${JSON.stringify(errorData)}`;
} else {
  errorMessage += ` - ${errorText.substring(0, 200)}`;
}
```

## Testing

### Test GET Request (Data Retrieval)
```bash
curl -X POST https://yahoo-mcp-production.up.railway.app/mcp/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_user_leagues",
      "arguments": {
        "gameKey": "nhl"
      }
    }
  }' | jq
```

### Test POST Request (Roster Modification)
```bash
curl -X POST https://yahoo-mcp-production.up.railway.app/mcp/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "add_drop_players",
      "arguments": {
        "leagueKey": "465.l.27830",
        "teamKey": "465.l.27830.t.10",
        "addPlayerKey": "465.p.3980",
        "dropPlayerKey": "465.p.5985"
      }
    }
  }' | jq
```

## Why This Wasn't Caught Earlier
- Yahoo Fantasy API defaults to XML (legacy format) for responses
- Yahoo Fantasy API **requires** XML for POST request bodies
- The dual format requirement (XML in, JSON out) wasn't immediately obvious
- GET requests worked after adding `?format=json`, but POST requests still failed
- The error message was clear but the fix required understanding Yahoo's specific requirements

## Yahoo API Format Requirements

### For GET Requests (Data Retrieval)
- **Request**: No body needed
- **Response**: Use `?format=json` to get JSON
- **Headers**: `Accept: application/json`

### For POST Requests (Transactions/Modifications)
- **Request Body**: Must be XML
- **Response**: Use `?format=json` to get JSON
- **Headers**: 
  - `Content-Type: application/xml` (for request body)
  - `Accept: application/json` (for response)

## Status
✅ **FIXED** - GET requests use JSON format and parse correctly
✅ **FIXED** - POST requests send XML with proper Content-Type header
✅ **TESTED** - Build succeeds with no TypeScript errors
✅ **IMPROVED** - Dynamic header detection for mixed GET/POST usage
✅ **READY** - Ready for deployment to handle roster modifications
