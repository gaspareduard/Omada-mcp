import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = { ...createPaginationSchema(), customHeaders: customHeadersSchema };

export function registerGetFirmwareUpgradePlanTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getFirmwareUpgradePlan',
        {
            description: 'Get the firmware upgrade plan list for devices managed by the controller.',
            inputSchema,
        },
        wrapToolHandler('getFirmwareUpgradePlan', async ({ page, pageSize, customHeaders }) =>
            toToolResult(await client.getFirmwareUpgradePlan(page ?? 1, pageSize ?? 10, customHeaders))
        )
    );
}
