import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetExperienceImprovementTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getExperienceImprovement',
        {
            description: 'Get the experience improvement program setting for the controller (telemetry/diagnostics participation).',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getExperienceImprovement', async ({ customHeaders }) => toToolResult(await client.getExperienceImprovement(customHeaders)))
    );
}
