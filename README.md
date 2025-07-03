![Pega DX MCP Server](./media/pega-dx-mcp-1280x640.png)

# Pega DX MCP Server

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io/)
[![Pega Platform](https://img.shields.io/badge/Pega_Infinity-23%2B-red.svg)](https://www.pega.com/)

## Enabling conversational AI interaction with Pega Applications

This package transforms Pega Infinity&trade; interactions into intuitive, conversational experiences through the Model Context Protocol. By bridging Pega DX APIs with natural language interfaces, it enables GenAI Agents, IDEs, and other MCP-enabled tools to interact with Pega Infinity&trade; applications using simple, human-readable commands.

## 🧪 Experimental

The Pega DX MCP Server is an experimental project exploring the intersection of Model Context Protocol and Pega Infinity&trade; capabilities. This is not an official Pegasystems product and is not generally available. All commands, parameters, and other features are subject to change or deprecation at any time, with or without notice. Do not use this MCP server for production functionality. This experiment demonstrates the potential of natural language interfaces for Pega Infinity&trade; interactions. We welcome feedback and contributions to help shape the future of GenAI-powered business automation.

## 🌟 Key Features

- **🤖 Natural Language Interface** - Demonstrates conversational case creation: "Create a travel claim for John"
- **🔌 Plug-and-Play Integration** - Experimental compatibility with GenAI Agents, IDEs, and MCP-enabled tools
- **🧪 Innovation Prototype** - Exploring enterprise-grade patterns with comprehensive error handling approaches
- **📡 API Integration Exploration** - Investigating access to cases, assignments, attachments, and data operations
- **⚡ Performance Research** - Experimenting with intelligent caching and optimization strategies
- **🛡️ Security Framework** - Implementing OAuth 2.1 with PKCE and role-based access control patterns

## 🚀 Quick Start

### Prerequisites

- Node.js (22+) and npm
- Access to Pega Infinity&trade; (23+) with DX API enabled
- OAuth 2.1 client credentials

### Installation

```bash
# Install from npm (recommended)
npm install -g @pega-enablement/pega-dx-mcp
```

### Integration with MCP Clients

Compatible with Claude Desktop, Cursor, Cline, and other MCP-enabled applications. Add to your MCP client's configuration file:

```json
{
  "mcpServers": {
    "pega-dx-mcp": {
      "command": "npx",
      "args": ["-y", "@pega-enablement/pega-dx-mcp"],
      "env": {
        "PEGA_BASE_URL": "https://your-pega-instance.com",
        "PEGA_CLIENT_ID": "your-client-id",
        "PEGA_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

**Configuration file locations:**
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%/Claude/claude_desktop_config.json` (Windows)
- **Cursor**: `.cursor/mcp.json` in your project root
- **Cline**: MCP settings in VS Code

**Verify installation:** Restart your MCP client and confirm the Pega DX tools are available.

## 🏗️ Architecture

The Pega DX MCP Server bridges GenAI applications with Pega Infinity using the Model Context Protocol:

![Pega DX MCP Server Architecture](./media/architecture.png)

## 🛠️ Available Tools

### Case Management

| Tool          | Description                                      | Example Usage                           |
| ------------- | ------------------------------------------------ | --------------------------------------- |
| `get_case`    | Get detailed information about a Pega case by ID | "Show me details for case TRAVEL-001"   |
| `create_case` | Create a new Pega case with specified case type  | "Create a travel claim for John to NYC" |
| `delete_case` | Delete a case that is currently in create stage  | "Delete case TRAVEL-001"                |

### System Management

| Tool                | Description                               | Example Usage                 |
| ------------------- | ----------------------------------------- | ----------------------------- |
| `ping_pega_service` | Test OAuth2 connectivity to Pega Platform | "Test the connection to Pega" |

## 💬 Usage Examples

> **Note**: The following examples demonstrate envisioned capabilities and planned user experiences. These scenarios represent the experimental goals of this GenAI Innovation project and may not reflect current implementation status.

### Creating a Case

```
User: "Create a new insurance claim for policy #12345"
AI: I'll create a new insurance claim case. What type of claim is this?
User: "Auto accident claim"
AI: ✅ Created auto accident claim case INS-CLAIM-789
    Case ID: INS-CLAIM-789
    Policy: #12345
    Status: Open
    Next step: Provide accident details
```

### Managing Assignments

```
User: "What's my next assignment?"
AI: You have 3 pending assignments:
    1. Review claim documentation (INS-CLAIM-789) - Due today
    2. Approve travel request (TRAVEL-456) - Due tomorrow
    3. Customer callback (SERVICE-123) - Due in 2 hours
User: "Let me work on the claim review"
AI: ✅ Opening claim documentation review for INS-CLAIM-789
    [Displays relevant case data and required actions]
```

## ⚙️ Configuration

### Environment Variables

```bash
# Pega Platform Connection
PEGA_BASE_URL=https://your-pega-instance.com
PEGA_API_VERSION=v2

# OAuth 2.1 Authentication
PEGA_CLIENT_ID=your-oauth-client-id
PEGA_CLIENT_SECRET=your-oauth-client-secret

# Server Configuration
LOG_LEVEL=info
CACHE_TTL=300000
REQUEST_TIMEOUT=30000
```

### OAuth Setup

1. **Register OAuth Client** in your Pega Platform
2. **Configure Scopes** for API access
3. **Set Redirect URIs** if using authorization code flow
4. **Update Environment** with client credentials

For detailed setup instructions, see our [Configuration Guide](docs/configuration.md).

## 🤝 Contributing

Join us in this exciting GenAI Innovation experiment! As an experimental project exploring the future of natural language interfaces for enterprise platforms, we welcome community participation in shaping this innovation journey.

### Ways to Contribute

- 🔬 **Experiment Feedback** - Share your experiences and insights from testing the prototype
- 💡 **Innovation Ideas** - Contribute to the GenAI Innovation roadmap with creative suggestions
- 🐛 **Issue Reports** - Help identify challenges in this experimental project
- 🔧 **Code Contributions** - Contribute to the codebase and proof-of-concept features
- 📖 **Documentation** - Help document learnings and experimental outcomes
- 🧪 **Testing & Validation** - Participate in testing new experimental capabilities

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/pega-dx-mcp.git
cd pega-dx-mcp

# Install dependencies
npm install

# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm test

# Submit pull request
```

### Guidelines

- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)
- Ensure tests pass and add new tests for features
- Update documentation for any API changes
- Use conventional commit messages

## 📄 License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ by Pegasystems**

[Website](https://www.pega.com) • [Community](https://community.pega.com) • [Documentation](https://docs.pega.com)

</div>
