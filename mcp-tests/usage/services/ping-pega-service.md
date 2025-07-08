# ping-pega-service End User Usage

## Overview
This document shows how end users can invoke the ping-pega-service tool to test Pega Platform connectivity.

## Use Case 1: Basic Connectivity Test

### Context
Test if your Pega MCP server can connect to the Pega Platform and authenticate properly.

### How to Invoke
In Claude Desktop or any MCP-compatible client, use this request:

```
Please use the ping_pega_service tool to test connectivity to our Pega Platform.
```

### Expected Response
The tool will return:
- Configuration details (Base URL, API URL, Token URL)
- OAuth2 authentication status
- Token information (type, length, acquisition status)
- Success/failure indicators

## Use Case 2: Environment Verification

### Context
Verify that all environment configuration is working correctly after setup or changes.

### How to Invoke
```
Can you ping the Pega service to verify our environment configuration is working?
```

### Expected Response
Same as Use Case 1 - comprehensive connectivity and authentication verification.

## Troubleshooting

### If Authentication Fails
- Check environment variables (PEGA_CLIENT_ID, PEGA_CLIENT_SECRET)
- Verify OAuth2 client configuration in Pega Platform
- Confirm base URL is accessible

### If Connection Fails
- Verify PEGA_BASE_URL is correct and accessible
- Check network connectivity to Pega Platform
- Confirm firewall settings allow HTTPS connections

## Integration Examples

### Before Running Other Tools
```
Before we start working with cases, please ping the Pega service to make sure everything is connected properly.
```

### Daily Health Check
```
Can you run a quick ping test to verify our Pega connection is still working?
