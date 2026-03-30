import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetBackupFileListTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getBackupFileList',
        {
            description: 'Get the list of available controller backup files.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getBackupFileList', async ({ customHeaders }) => toToolResult(await client.getBackupFileList(customHeaders)))
    );
}
