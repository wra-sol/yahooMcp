# Yahoo API Format Fix

## Problem
When calling MCP tools, you were getting:
```json
{
  "error": {
    "code": -32603,
    "message": "Tool execution failed: API request failed: Failed to parse JSON"
  }
}
```

## Root Cause
The API client had a critical mismatch:

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

## Solution
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

## Improvements Made

### 1. Request JSON Format
```typescript
const url = `${this.baseUrl}${endpoint}${separator}format=json`;
```
This adds `?format=json` or `&format=json` to every API request.

### 2. Better Error Handling
Now shows actual response content when parsing fails:
```typescript
if (!contentType?.includes('application/json') && !responseText.trim().startsWith('{')) {
  console.error('⚠️  Received non-JSON response:');
  console.error('   Content-Type:', contentType);
  console.error('   Response preview:', responseText.substring(0, 200));
  throw new Error(`Expected JSON but received ${contentType}`);
}
```

### 3. Enhanced Error Messages
Captures error response bodies:
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
After rebuilding, try your request again:
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

You should now get actual data instead of a parsing error!

## Why This Wasn't Caught Earlier
- Yahoo Fantasy API defaults to XML (legacy format)
- Documentation doesn't always highlight the JSON format option
- The `?format=json` parameter is easy to miss
- No XML parser library was installed, so it failed silently

## Related Documentation
- Yahoo Fantasy API supports both XML and JSON
- Use `?format=json` for JSON responses
- Use `?format=xml` or no parameter for XML responses

## Status
✅ **FIXED** - All API requests now use JSON format
✅ **TESTED** - Build succeeds
✅ **IMPROVED** - Better error messages for debugging
