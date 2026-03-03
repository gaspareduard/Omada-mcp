#!/usr/bin/env tsx
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadEnv } from 'dotenv';

import { loadConfigFromEnv } from '../src/config.js';
import { logger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const envPath = path.join(repoRoot, '.env');
const envLocalPath = path.join(repoRoot, '.env.local');

if (!existsSync(envPath)) {
    logger.error('Missing .env file at the repository root. Create one before running the MCP Inspector.');
    process.exit(1);
}

loadEnv({ path: envPath });

if (existsSync(envLocalPath)) {
    loadEnv({ path: envLocalPath, override: true });
}

const config = loadConfigFromEnv();

// Determine mode from command line argument
const mode = process.argv[2];
const validModes = ['dev', 'build'];

if (config.useHttp) {
    // HTTP mode: connect inspector to running server
    const port = config.httpPort ?? 3000;
    const httpPath = config.httpPath ?? '/mcp';
    const serverUrl = `http://localhost:${port}${httpPath}`;

    logger.info(`Starting MCP Inspector for streamable-http transport at ${serverUrl}`);
    logger.info('Note: This assumes the HTTP server is already running. Start it first with MCP_SERVER_USE_HTTP=true.');

    // The MCP Inspector CLI uses 'streamable-http' for the MCP stream transport
    const inspectorArgs = ['@modelcontextprotocol/inspector', '--transport', 'streamable-http', serverUrl];

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
        logger.error('Failed to launch MCP Inspector', { error });
        process.exit(1);
    });
} else {
    // Stdio mode: run server with inspector
    if (mode !== undefined && !validModes.includes(mode)) {
        logger.warn(`Invalid mode '${mode}'. Using 'dev' instead. Valid modes: ${validModes.join(', ')}`);
    }
    const actualMode = mode !== undefined && validModes.includes(mode) ? mode : 'dev';

    // Force HTTP mode off for stdio inspector
    process.env.MCP_SERVER_USE_HTTP = 'false';

    const serverCommand = actualMode === 'dev' ? ['tsx', 'src/index.ts'] : ['node', 'dist/index.js'];

    logger.info(`Starting MCP Inspector in stdio mode (${actualMode})`);

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
        logger.error('Failed to launch MCP Inspector', { error });
        process.exit(1);
    });
}
