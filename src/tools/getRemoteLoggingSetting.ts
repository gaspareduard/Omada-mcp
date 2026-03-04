import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetRemoteLoggingSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getRemoteLoggingSetting',
        {
            description: 'Get remote logging (syslog) configuration for the site. Returns syslog server address, port, and log level settings.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getRemoteLoggingSetting', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getRemoteLoggingSetting(siteId, customHeaders))
        )
    );
}
