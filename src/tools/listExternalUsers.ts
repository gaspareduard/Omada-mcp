import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = z.object({ customHeaders: customHeadersSchema });

type Client = Pick<OmadaClient, 'listExternalUsers'>;

export function registerListExternalUsersTool(server: McpServer, client: Client): void {
    server.registerTool(
        'listExternalUsers',
        {
            description: 'List users who have signed in to the controller through SSO, with their identity provider and role. Returns every page.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('listExternalUsers', async ({ customHeaders }) => toToolResult(await client.listExternalUsers(customHeaders)))
    );
}
