import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import type { ToolCategory, ToolPermission } from '../config.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { registerAllTools } from '../tools/index.js';
import { logger } from '../utils/logger.js';
import type { CatalogOptions } from './catalog.js';
import { createServer } from './common.js';

export async function startStdioServer(
    client: OmadaClient,
    activeCategories?: Map<ToolCategory, Set<ToolPermission>>,
    options: CatalogOptions = {}
): Promise<void> {
    logger.info('Starting stdio server');
    const server = createServer();
    registerAllTools(server, client, activeCategories, options);
    const transport = new StdioServerTransport();
    logger.info('Connecting stdio server');
    await server.connect(transport);
    logger.info('Stdio server connected');
}
