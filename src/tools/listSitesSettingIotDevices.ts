import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = siteInputSchema.extend(createPaginationSchema());

export function registerListSitesSettingIotDevicesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listSitesSettingIotDevices',
        {
            description:
                'List devices in a site that support Bluetooth advertising (iBeacon). Returns MAC, name, type, model, firmware version, and status per device.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('listSitesSettingIotDevices', async ({ siteId, page, pageSize, customHeaders }) =>
            toToolResult(await client.listSitesSettingIotDevices(siteId, page ?? 1, pageSize ?? 10, customHeaders))
        )
    );
}
