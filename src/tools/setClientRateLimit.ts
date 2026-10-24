import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
export function registerSetClientRateLimitTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = siteInputSchema.extend({
        clientMac: deviceMacSchema,
        downLimit: z.number().positive(),
        upLimit: z.number().positive(),
        dryRun: z.boolean().optional().default(true).describe('Preview without changing the controller. Set false explicitly to apply.'),
    });
    server.registerTool(
        'setClientRateLimit',
        {
            description: 'Set custom client rate limits in Kbps. Preview is the default; set dryRun:false to apply.',
            inputSchema: inputSchema.shape,
            annotations: { readOnlyHint: false, destructiveHint: true },
        },
        wrapMutationToolHandler(
            'setClientRateLimit',
            ({ clientMac, siteId }, result, mode) => ({
                action: 'setClientRateLimit',
                target: clientMac,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'submitted',
                summary: mode === 'dry-run' ? 'Client rate-limit change planned.' : 'Client rate-limit change submitted.',
                result,
            }),
            async ({ clientMac, downLimit, upLimit, siteId, customHeaders, dryRun }) => {
                if (dryRun) return { accepted: true, dryRun: true };
                return await client.setClientRateLimit(clientMac, downLimit, upLimit, siteId, customHeaders);
            }
        )
    );
}
