import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = z.object({ customHeaders: customHeadersSchema });

type Client = Pick<OmadaClient, 'listSamlIdps'>;

export function registerListSamlIdpsTool(server: McpServer, client: Client): void {
    server.registerTool(
        'listSamlIdps',
        {
            description: 'List the SAML identity providers configured for controller single sign-on. Returns every page.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('listSamlIdps', async ({ customHeaders }) => toToolResult(await client.listSamlIdps(customHeaders)))
    );
}
