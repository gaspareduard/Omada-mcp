import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetAttackDefenseSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getAttackDefenseSetting',
        {
            description: 'Get the DDoS and attack defense configuration, including flood protection settings and thresholds.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getAttackDefenseSetting', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getAttackDefenseSetting(siteId, customHeaders))
        )
    );
}
