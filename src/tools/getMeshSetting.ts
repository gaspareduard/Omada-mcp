import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetMeshSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getMeshSetting',
        {
            description: 'Get the mesh networking configuration including mesh topology mode and uplink preferences.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getMeshSetting', async ({ siteId, customHeaders }) => toToolResult(await client.getMeshSetting(siteId, customHeaders)))
    );
}
