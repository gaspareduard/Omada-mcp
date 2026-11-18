import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = z.object({ customHeaders: customHeadersSchema });

type Client = Pick<OmadaClient, 'listExternalUserGroups'>;

export function registerListExternalUserGroupsTool(server: McpServer, client: Client): void {
    server.registerTool(
        'listExternalUserGroups',
        {
            description: 'List SSO external user groups, which map identity-provider users to a controller role and site scope. Returns every page.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('listExternalUserGroups', async ({ customHeaders }) => toToolResult(await client.listExternalUserGroups(customHeaders)))
    );
}
