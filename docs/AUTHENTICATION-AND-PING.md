# Authentication and Ping Tools

This document explains the authentication and connectivity testing tools in the Pega DX MCP Server.

## Overview

As of version 0.1.11, authentication and connectivity testing have been separated into two distinct tools:

- **`authenticate_pega`**: Authenticates with Pega Infinity and stores the token in session
- **`ping_pega_service`**: Tests connectivity to Pega Infinity using existing authentication

## Why Separate Authentication and Ping?

Previously, the `ping_pega_service` tool performed authentication as a side effect of testing connectivity. This created several issues:

1. **Confusion**: Users expected ping to test connectivity, not perform authentication
2. **Token Management**: No way to explicitly provide or manage authentication tokens
3. **Efficiency**: Every connectivity test required re-authentication

The new design provides:

- **Separation of Concerns**: Authentication and connectivity testing are distinct operations
- **Token Reuse**: Authenticate once, use the token for multiple operations
- **Flexibility**: Support for OAuth credentials AND direct access tokens
- **Session Management**: Multiple sessions with different credentials

---

## authenticate_pega Tool

### Purpose

Authenticates with Pega Infinity server and stores the authentication token in session for use by other tools.

### Parameters

```javascript
{
  // Optional session credentials
  sessionCredentials: {
    sessionId: string,      // Optional session ID (auto-generated if not provided)
    baseUrl: string,        // Pega base URL (required)
    apiVersion: string,     // API version ('v1' or 'v2', default: 'v2')

    // OAuth Mode (client credentials flow)
    clientId: string,       // OAuth client ID
    clientSecret: string,   // OAuth client secret

    // OR Direct Token Mode
    accessToken: string,    // Direct access token
    tokenExpiry: number     // Token expiry in seconds from now (default: 3600)
  }
}
```

### Authentication Modes

#### 1. OAuth Mode (Client Credentials)

Use this when you have OAuth2 client credentials configured in Pega.

```javascript
{
  sessionCredentials: {
    baseUrl: "https://your-pega-instance.com",
    clientId: "your-client-id",
    clientSecret: "your-client-secret"
  }
}
```

#### 2. Direct Token Mode

Use this when you already have a valid access token (e.g., from another authentication system).

```javascript
{
  sessionCredentials: {
    baseUrl: "https://your-pega-instance.com",
    accessToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6...",
    tokenExpiry: 3600  // Optional: token expires in 1 hour
  }
}
```

#### 3. Environment Variables (Default)

If no `sessionCredentials` are provided, the tool uses environment variables:

```bash
PEGA_BASE_URL=https://your-pega-instance.com
PEGA_CLIENT_ID=your-client-id
PEGA_CLIENT_SECRET=your-client-secret
PEGA_API_VERSION=v2  # Optional, defaults to v2
```

### Response

```json
{
  "success": true,
  "sessionId": "session_abc123",
  "authMode": "oauth",
  "tokenInfo": {
    "type": "Bearer",
    "length": 125,
    "prefix": "eyJhbGciOi...",
    "expiresIn": 3600,
    "expiresAt": "2025-10-10T12:30:00.000Z"
  },
  "configuration": {
    "baseUrl": "https://your-pega-instance.com",
    "apiVersion": "v2",
    "configSource": "session"
  }
}
```

---

## ping_pega_service Tool

### Purpose

Tests connectivity and system availability of Pega Infinity server using existing authentication.

### Parameters

```javascript
{
  // Optional session credentials
  sessionCredentials: {
    sessionId: string  // Reference to existing authenticated session
  }
}
```

### Behavior

The ping tool performs two tests:

1. **Authentication Available**: Verifies that authentication exists (from session or environment)
2. **API Connectivity**: Makes a lightweight API call (GET /casetypes) to verify server is responding

If no sessionId is provided, it uses environment variables (backward compatible).

### Response

```json
{
  "success": true,
  "totalDuration": "250ms",
  "tests": [
    {
      "test": "Authentication Available",
      "success": true,
      "duration": "10ms",
      "message": "Using OAUTH authentication",
      "tokenInfo": {
        "type": "Bearer",
        "cached": true,
        "expiresInMinutes": 58
      }
    },
    {
      "test": "API Connectivity",
      "success": true,
      "duration": "240ms",
      "endpoint": "/api/application/v2/casetypes",
      "status": 200,
      "message": "Server is responding (found 5 case types)"
    }
  ]
}
```

---

## Usage Patterns

### Pattern 1: Environment-Based (Backward Compatible)

This pattern works exactly as before - no code changes needed.

```javascript
// Ping automatically authenticates using environment variables
await toolRegistry.executeTool('ping_pega_service', {});
```

### Pattern 2: Explicit Authentication + Operations

This pattern gives you more control over authentication.

```javascript
// Step 1: Authenticate
const authResult = await toolRegistry.executeTool('authenticate_pega', {
  sessionCredentials: {
    baseUrl: "https://pega.com",
    clientId: "my-client-id",
    clientSecret: "my-secret"
  }
});

// authResult contains sessionId: "session_abc123"

// Step 2: Use the session for operations
await toolRegistry.executeTool('ping_pega_service', {
  sessionCredentials: {
    sessionId: "session_abc123"
  }
});

await toolRegistry.executeTool('get_case', {
  caseID: "CASE-123",
  sessionCredentials: {
    sessionId: "session_abc123"
  }
});
```

### Pattern 3: Direct Token Provisioning

This pattern is useful when you obtain tokens from external systems.

```javascript
// Step 1: Provide the token directly
const authResult = await toolRegistry.executeTool('authenticate_pega', {
  sessionCredentials: {
    baseUrl: "https://pega.com",
    accessToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6...",
    tokenExpiry: 3600
  }
});

// Step 2: Use the session
await toolRegistry.executeTool('ping_pega_service', {
  sessionCredentials: {
    sessionId: authResult.sessionId
  }
});
```

### Pattern 4: Multiple Sessions

You can maintain multiple authenticated sessions with different credentials.

```javascript
// Session 1: Production environment
const prod = await toolRegistry.executeTool('authenticate_pega', {
  sessionCredentials: {
    sessionId: "prod_session",
    baseUrl: "https://prod.pega.com",
    clientId: "prod-client",
    clientSecret: "prod-secret"
  }
});

// Session 2: Development environment
const dev = await toolRegistry.executeTool('authenticate_pega', {
  sessionCredentials: {
    sessionId: "dev_session",
    baseUrl: "https://dev.pega.com",
    clientId: "dev-client",
    clientSecret: "dev-secret"
  }
});

// Use different sessions for different operations
await toolRegistry.executeTool('ping_pega_service', {
  sessionCredentials: { sessionId: "prod_session" }
});

await toolRegistry.executeTool('ping_pega_service', {
  sessionCredentials: { sessionId: "dev_session" }
});
```

---

## Token Management

### Token Caching

Tokens are cached per session to avoid unnecessary authentication requests:

- **OAuth Mode**: Token is cached until it expires (typically 1 hour)
- **Direct Token Mode**: Token is cached until the specified expiry time

### Token Expiry

The system automatically:

1. Checks if the cached token is expired before using it
2. Refreshes OAuth tokens automatically when needed
3. Provides warnings when direct tokens are expired

### Token Security

- Tokens are never exposed in API responses
- Only token metadata (length, prefix, expiry) is shown
- Tokens are stored in memory (not persisted to disk)

---

## Error Handling

### Authentication Errors

If authentication fails, you'll receive a detailed error response:

```json
{
  "success": false,
  "error": {
    "type": "AUTHENTICATION_ERROR",
    "message": "OAUTH authentication failed",
    "details": "Invalid client credentials",
    "troubleshooting": [
      "Verify baseUrl is correct and accessible",
      "Check clientId and clientSecret are valid",
      "Ensure OAuth2 client is configured in Pega Infinity",
      "Verify network connectivity to Pega instance"
    ]
  }
}
```

### Connectivity Errors

If the ping test fails, you'll see which test failed:

```json
{
  "success": false,
  "tests": [
    {
      "test": "Authentication Available",
      "success": true,
      "message": "Using OAUTH authentication"
    },
    {
      "test": "API Connectivity",
      "success": false,
      "error": "Connection timeout",
      "troubleshooting": [
        "Verify baseUrl is correct and accessible",
        "Check network connectivity to Pega instance",
        "Ensure Pega DX API is enabled",
        "Check firewall settings"
      ]
    }
  ]
}
```

---

## Migration Guide

### Existing Code (Before 0.1.11)

```javascript
// Old way: ping authenticates automatically
const result = await toolRegistry.executeTool('ping_pega_service', {
  sessionCredentials: {
    baseUrl: "https://pega.com",
    clientId: "client-id",
    clientSecret: "secret"
  }
});
```

### Updated Code (After 0.1.11)

```javascript
// Option 1: No changes needed (backward compatible)
const result = await toolRegistry.executeTool('ping_pega_service', {
  sessionCredentials: {
    baseUrl: "https://pega.com",
    clientId: "client-id",
    clientSecret: "secret"
  }
});

// Option 2: Explicit authentication (recommended)
const auth = await toolRegistry.executeTool('authenticate_pega', {
  sessionCredentials: {
    baseUrl: "https://pega.com",
    clientId: "client-id",
    clientSecret: "secret"
  }
});

const result = await toolRegistry.executeTool('ping_pega_service', {
  sessionCredentials: {
    sessionId: auth.sessionId
  }
});
```

**Note**: Existing code continues to work without changes. The ping tool still performs authentication if needed.

---

## Testing

Run the test suite to verify functionality:

```bash
# Test authenticate tool
node tests/v2/authenticate-test.js

# Test updated ping tool
node tests/v2/ping-service-test.js

# Test complete workflow
node tests/v2/authenticate-and-ping-test.js
```

---

## API Reference

### OAuth2Client Methods

The underlying OAuth2Client class now provides:

```javascript
// Set access token explicitly
oauth2Client.setAccessToken(token, expiresInSeconds);

// Get token info (without exposing token)
const info = oauth2Client.getTokenInfo();
// Returns: { authMode, cacheKey, hasToken, tokenExpiry, expiresInMinutes, ... }

// Clear token cache
oauth2Client.clearTokenCache();
```

---

## Best Practices

1. **Authenticate Once**: Call `authenticate_pega` once at the start of your workflow
2. **Reuse Sessions**: Pass the sessionId to subsequent operations
3. **Handle Expiry**: Monitor token expiry and re-authenticate when needed
4. **Separate Environments**: Use different sessions for different Pega environments
5. **Error Handling**: Always check the `success` field in responses
6. **Security**: Never log or expose actual token values

---

## Troubleshooting

### "Authentication not available" error

**Cause**: No valid authentication found in session or environment.

**Solution**: Call `authenticate_pega` first, or set environment variables.

### "Token has expired" error

**Cause**: The cached token or provided token has expired.

**Solution**: Call `authenticate_pega` again to get a fresh token.

### "Invalid client credentials" error

**Cause**: OAuth clientId/clientSecret are incorrect.

**Solution**: Verify credentials in Pega OAuth2 client configuration.

### Ping succeeds but other operations fail

**Cause**: Token has insufficient permissions.

**Solution**: Ensure the OAuth client or user has appropriate Pega access rights.

---

## Further Reading

- [Pega DX API Documentation](./platform/dx-api/)
- [OAuth 2.1 Specification](https://oauth.net/2.1/)
- [Session Management](./PROGRESS.md#session-parameters)
