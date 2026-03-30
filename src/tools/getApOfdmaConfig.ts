import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetApOfdmaConfigTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        apMac: deviceMacSchema.describe('MAC address of the access point (e.g., AA-BB-CC-DD-EE-FF).'),
        ...siteInputSchema.shape,
    });
    server.registerTool(
        'getApOfdmaConfig',
        {
            description: 'Get OFDMA (Orthogonal Frequency Division Multiple Access) configuration for a specific access point.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getApOfdmaConfig', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getApOfdmaConfig(apMac, siteId, customHeaders))
        )
    );
}
