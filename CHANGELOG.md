# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.13] - 2025-10-24

### Added
- **Startup Authentication**: Server now automatically attempts authentication at startup
  - Provides fail-fast feedback if credentials are invalid
  - Caches OAuth token early for faster first API call
  - Displays authentication status in startup logs with detailed information
  - Supports session-only mode when no environment credentials configured
- **Configuration Diagnostics Tool**: New `diagnose_pega_config` tool for troubleshooting
  - Displays configuration status without exposing secrets
  - Validates environment variables and loaded configuration
  - Shows authentication status and token information
  - Provides actionable next steps for configuration issues
- **Automatic Base URL Cleanup**: Smart handling of `/prweb` in base URL
  - Automatically detects and removes `/prweb` from `PEGA_BASE_URL`
  - Displays warning with cleaned URL for user awareness
  - Prevents common configuration mistakes

### Changed
- **Documentation Updates**: Corrected README.md to reflect actual codebase state
  - Updated tool count from 60+ to 67 tools across 11 categories
  - Corrected Service Tools count from 1 to 3 tools
  - Corrected Case Tools count from 16 to 20 tools
  - Added missing tools: `diagnose_pega_config`, `get_cases`, `update_case`
  - Added documentation for startup authentication behavior
  - Added notes about automatic `/prweb` cleanup
  - Added `PEGA_API_VERSION` to environment variables documentation

### Improved
- **Configuration Management**: Enhanced config validation with user-friendly warnings
  - API version validation (v1 or v2, defaults to v2)
  - Base URL format validation and automatic correction
- **Startup Experience**: Better visibility into server initialization
  - Detailed authentication status display
  - API version information in startup logs
  - Token expiry information display

## [0.1.12] - 2025-10-23

### Fixed
- **Environment Variable Priority**: Fixed dotenv configuration to respect MCP client environment variables
  - Changed from `import 'dotenv/config'` to `dotenv.config({ override: false })`
  - Ensures MCP configuration environment variables (PEGA_BASE_URL, PEGA_CLIENT_ID, etc.) take precedence over .env file
  - Fixes authentication issues when running via `npx` with MCP client configuration
  - Maintains backward compatibility for local development with .env file

## [0.1.11] - 2025-10-23

### Added
- **Traditional DX API (V1) Support**: Initial implementation of Pega Traditional DX API (V1) endpoints
  - `GET /cases` - Retrieve list of cases created by authenticated user
  - `POST /cases` - Create new case with V1 API
  - `PUT /cases/{ID}` - Update case with auto-fetch eTag capability
  - `GET /casetypes` - Get list of available case types
- **Version-Aware Architecture**: Router pattern for API version selection via `PEGA_API_VERSION` environment variable
- **Base API Client**: Shared authentication and HTTP logic for both V1 and V2 APIs
- **Authentication Tool**: New `authenticate_pega` tool for explicit authentication management
- **Enhanced Ping Service**: Updated ping tool with version-aware authentication
- **V1/V2 Documentation Split**: Separate sample questions and sample data files for each API version
- **Auto-fetch eTag**: Automatic eTag retrieval for operations requiring optimistic locking

### Changed
- **API Client Refactoring**: Split monolithic `pega-client.js` into:
  - `base-api-client.js` - Shared base client with authentication
  - `v1/client-v1.js` - Traditional DX API (V1) implementation
  - `v2/client-v2.js` - Constellation DX API (V2) implementation
  - `pega-client.js` - Router that delegates to version-specific clients
- **Package Dependencies**: Updated `@modelcontextprotocol/sdk` to v1.13.3
- **Configuration**: Enhanced config management for API version selection
- **Tool Updates**: Modified tools to support both V1 and V2 API versions:
  - `create-case.js` - Now supports both V1 and V2 endpoints
  - `update-case.js` - New tool for V1-specific case updates
  - `get-cases.js` - New tool for V1 case retrieval
  - `ping-service.js` - Version-aware connectivity testing

### Documentation
- **AUTHENTICATION-AND-PING.md**: Comprehensive guide for authentication and ping service usage
- **sample-questions-v1.md**: V1-specific sample questions and use cases
- **sample-data-v1.md**: V1 API request/response examples

### Infrastructure
- **Version Utilities**: New utility module for API version handling and response transformation
- **Session Configuration**: Enhanced session management for version-aware operations
- **Test Structure**: Foundation for separate V1 and V2 test suites

### Technical Details
- 38 files changed: 7,421 insertions, 3,384 deletions
- 13 commits ahead of main branch
- Node.js 22+ required
- Pega Infinity 23+ with DX API enabled

## [0.1.10] - Previous Release

Initial stable release with Constellation DX API (V2) support.
