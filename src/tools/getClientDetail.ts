import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetClientDetailTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        clientMac: z.string().min(1).describe('MAC address of the client to retrieve details for.'),
        ...siteInputSchema.shape,
    });

    server.registerTool(
        'getClientDetail',
        {
            description:
                'Get full detail for a specific client by MAC address, including connection info, IP, VLAN, signal strength, and traffic stats.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getClientDetail', async ({ clientMac, siteId, customHeaders }) =>
            toToolResult(await client.getClientDetail(clientMac, siteId, customHeaders))
        )
    );
}
