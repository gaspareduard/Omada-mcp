import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { type ToolExtra, toToolResult } from '../server/common.js';
import { logger } from '../utils/logger.js';

export function registerListSitesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listSites',
        {
            description: 'List all sites configured on the Omada controller.',
        },
        async (_args: unknown, extra: ToolExtra) => {
            const sessionId = extra.sessionId ?? 'unknown-session';
            logger.info('Tool invoked', { tool: 'listSites', sessionId });

            try {
                const result = toToolResult(await client.listSites());
                logger.info('Tool completed', { tool: 'listSites', sessionId });
                return result;
            } catch (error) {
                logger.error('Tool failed', {
                    tool: 'listSites',
                    sessionId,
                    error: error instanceof Error ? error.message : String(error),
                });
                throw error;
            }
        }
    );
}
