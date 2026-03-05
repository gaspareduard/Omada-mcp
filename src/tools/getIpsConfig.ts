import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetIpsConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getIpsConfig',
        {
            description: 'Get the IPS (Intrusion Prevention System) global configuration, including enabled state and detection mode.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getIpsConfig', async ({ siteId, customHeaders }) => toToolResult(await client.getIpsConfig(siteId, customHeaders)))
    );
}
