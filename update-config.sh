#!/bin/bash

# Pega DX MCP Configuration Updater
# This script updates mcp-config.json with values from .env

echo "🚀 Updating MCP Configuration..."
echo "================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your Pega configuration."
    echo "You can copy from .env.example as a starting point."
    exit 1
fi

# Run the update script
node tools/update-mcp-config.js

# Check if the script ran successfully
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Configuration updated successfully!"
    echo ""
    echo "📋 Current configuration:"
    echo "------------------------"
    cat mcp-config.json | jq '.mcpServers["pega-dx-mcp"].env' 2>/dev/null || echo "Install jq to see formatted output"
else
    echo "❌ Configuration update failed!"
    exit 1
fi
