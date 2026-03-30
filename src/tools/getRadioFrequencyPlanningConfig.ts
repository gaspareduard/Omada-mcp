import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetRadioFrequencyPlanningConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getRadioFrequencyPlanningConfig',
        {
            description: 'Get the RF planning configuration for the site, including frequency band assignments and channel planning settings.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getRadioFrequencyPlanningConfig', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getRadioFrequencyPlanningConfig(siteId, customHeaders))
        )
    );
}
