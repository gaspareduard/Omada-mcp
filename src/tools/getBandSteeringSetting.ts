import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetBandSteeringSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getBandSteeringSetting',
        {
            description:
                'Get the band steering configuration. Band steering encourages dual-band clients to connect on 5GHz or 6GHz instead of 2.4GHz.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getBandSteeringSetting', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getBandSteeringSetting(siteId, customHeaders))
        )
    );
}
