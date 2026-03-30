import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = z.object({
    page: z.number().int().min(1).default(1).describe('Page number (1-based).'),
    pageSize: z.number().int().min(1).max(1000).default(10).describe('Number of results per page (1–1000).'),
    sortUsername: z.enum(['asc', 'desc']).optional().describe('Sort direction for username field.'),
    ...siteInputSchema.shape,
});

export function registerGetRadiusUserDetailTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getRadiusUserDetail',
        {
            description:
                '[DEPRECATED] Get built-in RADIUS server users. There is no per-user detail endpoint — this is an alias for getBuiltinRadiusUsers. Use getBuiltinRadiusUsers instead.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getRadiusUserDetail', async ({ page, pageSize, sortUsername, siteId, customHeaders }) =>
            toToolResult(await client.getRadiusUserList(page, pageSize, sortUsername, siteId, customHeaders))
        )
    );
}
