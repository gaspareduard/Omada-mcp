import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetRadioFrequencyPlanningResultTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getRadioFrequencyPlanningResult',
        {
            description: 'Get the RF planning result for the site. Returns computed channel/power assignments based on the current RF environment.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getRadioFrequencyPlanningResult', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getRadioFrequencyPlanningResult(siteId, customHeaders))
        )
    );
}
