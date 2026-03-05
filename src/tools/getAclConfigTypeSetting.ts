import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetAclConfigTypeSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getAclConfigTypeSetting',
        {
            description:
                'Get the ACL configuration type setting for the site gateway (L2 or L3 mode). Determines how ACL rules are evaluated for traffic.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getAclConfigTypeSetting', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getAclConfigTypeSetting(siteId, customHeaders))
        )
    );
}
