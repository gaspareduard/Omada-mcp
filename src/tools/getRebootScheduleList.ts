import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetRebootScheduleListTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        siteTemplateId: z.string().min(1).describe('The ID of the site template to retrieve reboot schedules for.'),
        customHeaders: customHeadersSchema,
    });
    server.registerTool(
        'getRebootScheduleList',
        {
            description: 'Get the list of device reboot schedules for a site template.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getRebootScheduleList', async ({ siteTemplateId, customHeaders }) =>
            toToolResult(await client.getRebootScheduleList(siteTemplateId, customHeaders))
        )
    );
}
