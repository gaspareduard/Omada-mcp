import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = z.object({
    profileId: z.string().min(1).describe('ID of the PPSK profile to retrieve users for. Use getPpskNetworkProfile to find available profile IDs.'),
    ...siteInputSchema.shape,
});

export function registerGetPpskUserListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getPpskUserList',
        {
            description: '[DEPRECATED] Get PPSK user list for a profile. This is an alias for getPpskUserGroup — use getPpskUserGroup instead.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getPpskUserList', async ({ profileId, siteId, customHeaders }) =>
            toToolResult(await client.getPpskUserGroup(profileId, siteId, customHeaders))
        )
    );
}
