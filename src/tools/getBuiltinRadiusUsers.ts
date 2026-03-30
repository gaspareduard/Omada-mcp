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

export function registerGetBuiltinRadiusUsersTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getBuiltinRadiusUsers',
        {
            description: 'Get the built-in RADIUS server user list for a site (paginated), including username and associated VLAN/group assignments.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getBuiltinRadiusUsers', async ({ page, pageSize, sortUsername, siteId, customHeaders }) =>
            toToolResult(await client.getRadiusUserList(page, pageSize, sortUsername, siteId, customHeaders))
        )
    );
}
