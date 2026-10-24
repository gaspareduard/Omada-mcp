import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
export function registerDisableClientRateLimitTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = siteInputSchema.extend({
        clientMac: deviceMacSchema,

        dryRun: z.boolean().optional().default(true).describe('Preview without changing the controller. Set false explicitly to apply.'),
    });
    server.registerTool(
        'disableClientRateLimit',
        {
            description: 'Disable rate limiting for a client. Preview is the default; set dryRun:false to apply.',
            inputSchema: inputSchema.shape,
            annotations: { readOnlyHint: false, destructiveHint: true },
        },
        wrapMutationToolHandler(
            'disableClientRateLimit',
            ({ clientMac, siteId }, result, mode) => ({
                action: 'disableClientRateLimit',
                target: clientMac,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'submitted',
                summary: mode === 'dry-run' ? 'Client rate-limit change planned.' : 'Client rate-limit change submitted.',
                result,
            }),
            async ({ clientMac, siteId, customHeaders, dryRun }) => {
                if (dryRun) return { accepted: true, dryRun: true };
                return await client.disableClientRateLimit(clientMac, siteId, customHeaders);
            }
        )
    );
}
