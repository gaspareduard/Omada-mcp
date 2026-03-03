import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerSetClientRateLimitTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = siteInputSchema.extend({
        clientMac: z.string().min(1, 'clientMac (MAC address) is required'),
        downLimit: z.number().positive('downLimit must be a positive number (in Kbps)'),
        upLimit: z.number().positive('upLimit must be a positive number (in Kbps)'),
    });

    server.registerTool(
        'setClientRateLimit',
        {
            description:
                'Set custom rate limit (bandwidth control) for a specific client. Specify download and upload limits in Kbps. This configures custom limits directly without using a predefined profile.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('setClientRateLimit', async ({ clientMac, downLimit, upLimit, siteId, customHeaders }) =>
            toToolResult(await client.setClientRateLimit(clientMac, downLimit, upLimit, siteId, customHeaders))
        )
    );
}
