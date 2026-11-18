import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = z.object({ customHeaders: customHeadersSchema });

type Client = Pick<OmadaClient, 'getBackupSchedule'>;

export function registerGetBackupScheduleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'getBackupSchedule',
        {
            description:
                "Get the controller's automatic backup schedule: whether it is enabled, when it runs, retention, storage target and which data it keeps.",
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getBackupSchedule', async ({ customHeaders }) => toToolResult(await client.getBackupSchedule(customHeaders)))
    );
}
