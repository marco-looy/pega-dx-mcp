#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

/**
 * Parse .env file and return key-value pairs
 * @param {string} envPath - Path to .env file
 * @returns {Object} Environment variables object
 */
function parseEnvFile(envPath) {
    const envVars = {};
    
    if (!fs.existsSync(envPath)) {
        console.error(`❌ .env file not found at: ${envPath}`);
        process.exit(1);
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }
        
        // Parse key=value pairs
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex > 0) {
            const key = trimmed.substring(0, equalIndex).trim();
            const value = trimmed.substring(equalIndex + 1).trim();
            
            // Remove quotes if present
            envVars[key] = value.replace(/^["']|["']$/g, '');
        }
    }
    
    return envVars;
}

/**
 * Update MCP configuration with environment variables
 * @param {string} configPath - Path to mcp-config.json
 * @param {Object} envVars - Environment variables
 */
function updateMcpConfig(configPath, envVars) {
    let config;
    
    // Read existing config or create new one
    if (fs.existsSync(configPath)) {
        try {
            const configContent = fs.readFileSync(configPath, 'utf8');
            config = JSON.parse(configContent);
        } catch (error) {
            console.error(`❌ Error parsing existing mcp-config.json: ${error.message}`);
            process.exit(1);
        }
    } else {
        // Create new config structure
        config = {
            mcpServers: {}
        };
    }
    
    // Ensure pega-dx-mcp server exists
    if (!config.mcpServers['pega-dx-mcp']) {
        config.mcpServers['pega-dx-mcp'] = {
            command: 'node',
            args: [path.join(projectRoot, 'src', 'index.js')],
            env: {}
        };
    }
    
    // Update environment variables
    const serverConfig = config.mcpServers['pega-dx-mcp'];
    
    // Map of environment variables to include
    const envVarsToInclude = [
        'PEGA_BASE_URL',
        'PEGA_API_VERSION',
        'PEGA_CLIENT_ID',
        'PEGA_CLIENT_SECRET',
        'LOG_LEVEL',
        'CACHE_TTL',
        'REQUEST_TIMEOUT'
    ];
    
    console.log('🔄 Updating MCP configuration...');
    
    // Update each environment variable
    for (const envVar of envVarsToInclude) {
        if (envVars[envVar]) {
            const oldValue = serverConfig.env[envVar];
            serverConfig.env[envVar] = envVars[envVar];
            
            if (oldValue !== envVars[envVar]) {
                console.log(`  ✓ ${envVar}: ${oldValue ? 'updated' : 'added'}`);
            }
        } else {
            console.log(`  ⚠️  ${envVar}: not found in .env file`);
        }
    }
    
    // Write updated config
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`✅ MCP configuration updated successfully: ${configPath}`);
    } catch (error) {
        console.error(`❌ Error writing mcp-config.json: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Update generic MCP client configuration with environment variables
 * @param {string} mcpConfigPath - Path to MCP client's configuration file
 * @param {Object} envVars - Environment variables
 */
function updateGenericMcpConfig(mcpConfigPath, envVars) {
    if (!mcpConfigPath || !fs.existsSync(mcpConfigPath)) {
        console.log(`⚠️  MCP client config not found at: ${mcpConfigPath || 'undefined'}`);
        console.log('   Skipping MCP client configuration update.');
        return;
    }

    let mcpConfig;
    
    try {
        const configContent = fs.readFileSync(mcpConfigPath, 'utf8');
        mcpConfig = JSON.parse(configContent);
    } catch (error) {
        console.error(`❌ Error parsing MCP client config: ${error.message}`);
        return;
    }
    
    // Check if pega-dx-mcp server exists in MCP config
    if (!mcpConfig.mcpServers || !mcpConfig.mcpServers['pega-dx-mcp']) {
        console.log(`⚠️  pega-dx-mcp server not found in MCP client configuration.`);
        console.log('   Please add the server through your MCP client settings first.');
        return;
    }
    
    const mcpServerConfig = mcpConfig.mcpServers['pega-dx-mcp'];
    
    console.log('🔄 Updating MCP client configuration...');
    
    // Map of environment variables to include
    const envVarsToInclude = [
        'PEGA_BASE_URL',
        'PEGA_API_VERSION',
        'PEGA_CLIENT_ID',
        'PEGA_CLIENT_SECRET',
        'LOG_LEVEL',
        'CACHE_TTL',
        'REQUEST_TIMEOUT'
    ];
    
    let updated = false;
    
    // Update each environment variable
    for (const envVar of envVarsToInclude) {
        if (envVars[envVar]) {
            const oldValue = mcpServerConfig.env?.[envVar];
            
            if (!mcpServerConfig.env) {
                mcpServerConfig.env = {};
            }
            
            mcpServerConfig.env[envVar] = envVars[envVar];
            
            if (oldValue !== envVars[envVar]) {
                console.log(`  ✓ ${envVar}: ${oldValue ? 'updated' : 'added'} in MCP client config`);
                updated = true;
            }
        }
    }
    
    if (updated) {
        // Write updated MCP config
        try {
            fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
            console.log(`✅ MCP client configuration updated successfully: ${mcpConfigPath}`);
        } catch (error) {
            console.error(`❌ Error writing MCP client config: ${error.message}`);
        }
    } else {
        console.log('ℹ️  MCP client configuration already up to date.');
    }
}

/**
 * Main function
 */
function main() {
    console.log('🚀 Pega DX MCP Configuration Updater');
    console.log('=====================================');
    
    const envPath = path.join(projectRoot, '.env');
    const configPath = path.join(projectRoot, 'mcp-config.json');
    
    console.log(`📁 Project root: ${projectRoot}`);
    console.log(`📄 Reading .env from: ${envPath}`);
    console.log(`📄 Updating config at: ${configPath}`);
    console.log('');
    
    // Parse .env file
    const envVars = parseEnvFile(envPath);
    console.log(`📋 Found ${Object.keys(envVars).length} environment variables`);
    
    // Update local MCP config
    updateMcpConfig(configPath, envVars);
    
    // Update MCP client configuration if path is provided
    if (envVars.MCP_CONFIG_PATH) {
        console.log('');
        console.log(`📄 Updating MCP client config at: ${envVars.MCP_CONFIG_PATH}`);
        updateGenericMcpConfig(envVars.MCP_CONFIG_PATH, envVars);
    }
    
    console.log('');
    console.log('🎉 Configuration update completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your MCP client (Claude Desktop, etc.)');
    console.log('2. Test the connection with: npm run test:ping');
}

// Run main function
main();
