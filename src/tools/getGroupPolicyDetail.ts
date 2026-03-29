import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetGroupPolicyDetailTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        groupType: z
            .enum(['0', '1', '2', '3', '4', '5', '7'])
            .describe(
                'Group type: "0" = IP Group, "1" = IP Port Group, "2" = Mac Group, "3" = IPv6 Group, "4" = IPv6 Port Group, "5" = Country Group, "7" = Domain Group.'
            ),
        ...siteInputSchema.shape,
    });

    server.registerTool(
        'getGroupPolicyDetail',
        {
            description:
                'Get group policy profiles for a site filtered by group type (IP Group, IP Port Group, MAC Group, IPv6 Group, IPv6 Port Group, Country Group, or Domain Group). Returns all matching profile entries.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getGroupPolicyDetail', async ({ groupType, siteId, customHeaders }) =>
            toToolResult(await client.getGroupProfilesByType(groupType, siteId, customHeaders))
        )
    );
}
