import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetApLoadBalanceTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        apMac: deviceMacSchema.describe('MAC address of the access point (e.g., AA-BB-CC-DD-EE-FF).'),
        ...siteInputSchema.shape,
    });
    server.registerTool(
        'getApLoadBalance',
        {
            description:
                '[DEPRECATED] Use getSitesApsLoadBalance instead. Same endpoint, retained for backward compatibility. getSitesApsLoadBalance is the canonical tool name and should be preferred for consistency. Get load balance configuration for a specific access point, including maximum client count settings.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getApLoadBalance', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getApLoadBalance(apMac, siteId, customHeaders))
        )
    );
}
