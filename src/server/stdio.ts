import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import type { ToolCategory, ToolPermission } from '../config.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { registerAllTools } from '../tools/index.js';
import { logger } from '../utils/logger.js';

import { createServer } from './common.js';

export async function startStdioServer(client: OmadaClient, activeCategories?: Map<ToolCategory, Set<ToolPermission>>): Promise<void> {
    logger.info('Starting stdio server');
    const server = createServer();
    registerAllTools(server, client, activeCategories);
    const transport = new StdioServerTransport();
    logger.info('Connecting stdio server');
    await server.connect(transport);
    logger.info('Stdio server connected');
}
