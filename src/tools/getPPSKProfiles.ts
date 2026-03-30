import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetPPSKProfilesTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        type: z
            .union([z.literal(0), z.literal(1), z.literal(2)])
            .describe('PPSK profile type: 0 = PPSK Without RADIUS, 1 = PPSK With Built-In RADIUS, 2 = PPSK With External RADIUS.'),
        ...siteInputSchema.shape,
    });

    server.registerTool(
        'getPPSKProfiles',
        {
            description:
                'List Private PSK (PPSK) profiles for the site by type. PPSK allows assigning unique per-device or per-user Wi-Fi passwords on a shared SSID.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getPPSKProfiles', async ({ type, siteId, customHeaders }) =>
            toToolResult(await client.getPPSKProfiles(type, siteId, customHeaders))
        )
    );
}
