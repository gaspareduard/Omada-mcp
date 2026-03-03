#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadEnv } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const envPath = path.join(repoRoot, '.env');
const envLocalPath = path.join(repoRoot, '.env.local');

if (!existsSync(envPath)) {
    console.error('Missing .env file at the repository root. Create one before running the MCP Inspector.');
    process.exit(1);
}

loadEnv({ path: envPath });

if (existsSync(envLocalPath)) {
    loadEnv({ path: envLocalPath, override: true });
}

// Determine mode from command line argument or environment
const mode = process.argv[2];
const validModes = ['dev', 'build'];

// Check if we should use HTTP mode based on environment
const useHttp = process.env.MCP_SERVER_USE_HTTP === 'true';

if (useHttp) {
    // HTTP mode: connect inspector to running server
    const transport = process.env.MCP_HTTP_TRANSPORT || 'stream';
    const port = process.env.MCP_HTTP_PORT || '3000';
    const httpPath = process.env.MCP_HTTP_PATH || (transport === 'sse' ? '/sse' : '/mcp');
    const serverUrl = `http://localhost:${port}${httpPath}`;

    console.log(`Starting MCP Inspector for ${transport} transport at ${serverUrl}`);
    console.log('Note: This assumes the HTTP server is already running. Start it first with MCP_SERVER_USE_HTTP=true.');

    // The MCP Inspector CLI uses 'streamable-http' for the stream transport
    const inspectorTransport = transport === 'stream' ? 'streamable-http' : transport;
    const inspectorArgs = ['@modelcontextprotocol/inspector', '--transport', inspectorTransport, serverUrl];

    const child = spawn('npx', inspectorArgs, {
        stdio: 'inherit',
        cwd: repoRoot,
        env: process.env,
    });

    child.on('exit', (code, signal) => {
        if (signal) {
            process.kill(process.pid, signal);
            return;
        }
        process.exit(code ?? 0);
    });

    child.on('error', (error) => {
        console.error('Failed to launch MCP Inspector', error);
        process.exit(1);
    });
} else {
    // Stdio mode: run server with inspector
    if (mode && !validModes.includes(mode)) {
        console.warn(`Invalid mode '${mode}'. Using 'dev' instead. Valid modes: ${validModes.join(', ')}`);
    }
    const actualMode = mode && validModes.includes(mode) ? mode : 'dev';

    // Force HTTP mode off for stdio inspector
    process.env.MCP_SERVER_USE_HTTP = 'false';

    const serverCommand = actualMode === 'dev' ? ['tsx', 'src/index.ts'] : ['node', 'dist/index.js'];

    console.log(`Starting MCP Inspector in stdio mode (${actualMode})`);

    const child = spawn('npx', ['@modelcontextprotocol/inspector', ...serverCommand], {
        stdio: 'inherit',
        cwd: repoRoot,
        env: process.env,
    });

    child.on('exit', (code, signal) => {
        if (signal) {
            process.kill(process.pid, signal);
            return;
        }
        process.exit(code ?? 0);
    });

    child.on('error', (error) => {
        console.error('Failed to launch MCP Inspector', error);
        process.exit(1);
    });
}
