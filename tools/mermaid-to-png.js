#!/usr/bin/env node

/**
 * Mermaid to PNG Converter
 * Uses the official @mermaid-js/mermaid-cli via npx for reliable conversion
 * 
 * Usage:
 *   node tools/mermaid-to-png.js <input.mmd> <output-name>
 *   echo "graph LR..." | node tools/mermaid-to-png.js - <output-name>
 */

import { execSync } from 'child_process';
import { readFile, writeFile, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mediaDir = join(__dirname, '../media');

/**
 * Read mermaid input from file or stdin
 */
async function readMermaidInput(inputPath) {
  if (inputPath === '-') {
    // Read from stdin
    return new Promise((resolve, reject) => {
      let data = '';
      process.stdin.setEncoding('utf8');
      
      process.stdin.on('data', chunk => {
        data += chunk;
      });
      
      process.stdin.on('end', () => {
        resolve(data.trim());
      });
      
      process.stdin.on('error', reject);
    });
  } else {
    // Read from file
    try {
      return await readFile(inputPath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read input file: ${error.message}`);
    }
  }
}

/**
 * Convert Mermaid syntax to PNG using official CLI
 */
async function convertMermaidToPng(inputPath, outputName, options = {}) {
  const {
    theme = 'neutral',
    background = 'white',
    width = 1200,
    height = 800
  } = options;

  let tempFile = null;
  
  try {
    console.log(`🔄 Reading Mermaid input...`);
    const mermaidSyntax = await readMermaidInput(inputPath);
    
    if (!mermaidSyntax.trim()) {
      throw new Error('No Mermaid syntax provided');
    }

    // Create temporary file for mermaid input
    const timestamp = Date.now();
    tempFile = join(tmpdir(), `mermaid-${timestamp}.mmd`);
    
    console.log(`📝 Writing temporary file: ${tempFile}`);
    await writeFile(tempFile, mermaidSyntax);
    
    // Prepare output path
    const outputPath = join(mediaDir, `${outputName}.png`);
    
    // Build mmdc command with options
    const mmdc_options = [
      `-i "${tempFile}"`,
      `-o "${outputPath}"`,
      `-t ${theme}`,
      `-b ${background}`,
      `--width ${width}`,
      `--height ${height}`
    ].join(' ');
    
    console.log(`🎨 Converting with mermaid-cli...`);
    console.log(`Command: npx -p @mermaid-js/mermaid-cli mmdc ${mmdc_options}`);
    
    // Execute conversion using npx and official CLI
    execSync(`npx -p @mermaid-js/mermaid-cli mmdc ${mmdc_options}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log(`\n🎉 Conversion completed successfully!`);
    console.log(`📁 Output: ${outputPath}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    // Clean up temporary file
    if (tempFile) {
      try {
        await unlink(tempFile);
        console.log(`🧹 Cleaned up temporary file`);
      } catch (cleanupError) {
        console.warn(`⚠️ Warning: Could not clean up temporary file: ${cleanupError.message}`);
      }
    }
  }
}

/**
 * CLI Interface
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
📊 Mermaid to PNG Converter (Official CLI)

Usage:
  node tools/mermaid-to-png.js <input.mmd> <output-name>
  echo "graph LR..." | node tools/mermaid-to-png.js - <output-name>

Examples:
  node tools/mermaid-to-png.js diagram.mmd architecture
  echo "graph LR; A-->B" | node tools/mermaid-to-png.js - simple-flow

Options:
  input.mmd     Mermaid file path (use '-' for stdin)
  output-name   Output filename (without .png extension)

Output:
  Saves PNG file to ./media/<output-name>.png

Features:
  ✅ Uses official @mermaid-js/mermaid-cli via npx
  ✅ No additional dependencies required
  ✅ Professional quality output
  ✅ Reliable DOM environment handling
`);
    process.exit(1);
  }

  const [inputPath, outputName] = args;
  
  // Parse additional options (can be extended)
  const options = {
    theme: 'neutral',
    background: 'white',
    width: 1200,
    height: 800
  };
  
  convertMermaidToPng(inputPath, outputName, options);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { convertMermaidToPng };
