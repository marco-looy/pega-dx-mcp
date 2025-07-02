![Pega DX MCP Server](./media/pega-dx-mcp.png)

# Pega DX MCP Server

🧪 **GENAI INNOVATION & ENABLEMENT EXPERIMENT**

The Pega DX MCP Server is an experimental project from Pegasystems' GenAI Innovation & Enablement team, exploring the intersection of Model Context Protocol and Pega Infinity capabilities. This is not an official Pegasystems product and is not generally available. All commands, parameters, and other features are subject to change or deprecation at any time, with or without notice. Don't implement production functionality with these tools. This experiment aims to demonstrate the potential of natural language interfaces for Pega Infinity interactions. We welcome feedback and contributions to help shape the future direction of this innovation.

---

## Model Context Protocol server for Pega Digital Experience APIs

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io/)
[![Pega Platform](https://img.shields.io/badge/Pega-8.8%2B-red.svg)](https://www.pega.com/)

This experimental initiative explores how to transform Pega Infinity interactions into intuitive, conversational experiences by exposing Pega DX APIs through the standardized Model Context Protocol. The project demonstrates the potential for GenAI Agents, IDEs, and other MCP-enabled tools to interact with Pega through natural language interfaces.

---

## 🌟 Key Features

- **🤖 Natural Language Interface** - Demonstrates conversational case creation: "Create a travel claim for John"
- **🔌 Plug-and-Play Integration** - Experimental compatibility with GenAI Agents, IDEs, and MCP-enabled tools
- **🧪 Innovation Prototype** - Exploring enterprise-grade patterns with comprehensive error handling approaches
- **📡 API Integration Exploration** - Investigating access to cases, assignments, attachments, and data operations
- **⚡ Performance Research** - Experimenting with intelligent caching and optimization strategies
- **🛡️ Security Framework** - Implementing OAuth 2.1 with PKCE and role-based access control patterns

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Access to Pega Platform (8.8+) with DX API enabled
- OAuth 2.1 client credentials

### Installation

```bash
# Install from npm (recommended)
npm install -g @marco-looy/pega-dx-mcp

# Or install locally for development
npm install @marco-looy/pega-dx-mcp
```

### Integration with Claude Desktop

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "pega-dx": {
      "command": "npx",
      "args": ["-y", "@marco-looy/pega-dx-mcp"],
      "env": {
        "PEGA_BASE_URL": "https://your-pega-instance.com",
        "PEGA_CLIENT_ID": "your-client-id",
        "PEGA_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

### Integration with Other MCP Clients

**Cursor**

Add to your Cursor `mcp.json` file:

```json
{
  "mcpServers": {
    "pega-dx": {
      "command": {
        "path": "npx",
        "args": ["-y", "@marco-looy/pega-dx-mcp"]
      },
      "env": {
        "PEGA_BASE_URL": "https://your-pega-instance.com",
        "PEGA_CLIENT_ID": "your-client-id", 
        "PEGA_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

**Cline**

Add to your Cline `cline_mcp_settings.json` file:

```json
{
  "mcpServers": {
    "pega-dx": {
      "command": "npx",
      "args": ["-y", "@marco-looy/pega-dx-mcp"],
      "env": {
        "PEGA_BASE_URL": "https://your-pega-instance.com",
        "PEGA_CLIENT_ID": "your-client-id",
        "PEGA_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

**Other Clients**

For other MCP-enabled clients, refer to their documentation for adding MCP servers and follow the same pattern using:
- **Command**: `npx`
- **Args**: `["-y", "@marco-looy/pega-dx-mcp"]`
- **Environment variables**: Pega connection details

## 🏗️ Architecture

The Pega DX MCP Server bridges AI applications with Pega Platform using the Model Context Protocol:

![Pega DX MCP Server Architecture](./media/architecture.png)

## 🛠️ Available Tools

### Case Management

| Tool                   | Description                   | Example Usage                                   |
| ---------------------- | ----------------------------- | ----------------------------------------------- |
| `pega_case_types_list` | List available case types     | "What case types are available?"                |
| `pega_case_types_get`  | Get case type details         | "What fields are required for travel requests?" |
| `pega_cases_create`    | Create new cases              | "Create a travel claim for John to New York"    |
| `pega_cases_list`      | List cases with filtering     | "Show me all open insurance claims"             |
| `pega_cases_get`       | Get detailed case information | "Show me details for case TRAVEL-001"           |

### Assignment Management

| Tool                       | Description                   | Example Usage                 |
| -------------------------- | ----------------------------- | ----------------------------- |
| `pega_assignments_next`    | Get next available assignment | "What's my next task?"        |
| `pega_assignments_list`    | List user assignments         | "Show my pending assignments" |
| `pega_assignments_execute` | Execute assignment actions    | "Approve the travel request"  |

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
PEGA_SCOPE=api

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
- 🐛 **Issue Reports** - Help identify challenges in this experimental environment
- 🔧 **Code Contributions** - Contribute to the experimental codebase and proof-of-concept features
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
