import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetGroupProfilesByTypeTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        groupType: z.enum(['0', '1', '2']).describe('Group type: "0" = IP Group, "1" = IP Port Group, "2" = Mac Group.'),
        ...siteInputSchema.shape,
    });

    server.registerTool(
        'getGroupProfilesByType',
        {
            description:
                'Get group profiles filtered by type (e.g. IP groups, port groups, domain groups). Returns all group profiles matching the specified groupType.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getGroupProfilesByType', async ({ groupType, siteId, customHeaders }) =>
            toToolResult(await client.getGroupProfilesByType(groupType, siteId, customHeaders))
        )
    );
}
