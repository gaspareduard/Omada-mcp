import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';

const clientMacSchema = z
    .string()
    .trim()
    .regex(/^[0-9A-Fa-f]{2}([:-][0-9A-Fa-f]{2}){5}$/, 'Invalid client MAC address format. Expected "AA-BB-CC-DD-EE-FF" or "AA:BB:CC:DD:EE:FF".');

export function registerBlockClientTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = siteInputSchema.extend({
        clientMac: clientMacSchema.describe('Client MAC address to block.'),
        dryRun: z.boolean().optional().default(false).describe('If true, return the planned action without sending it to the controller.'),
    });

    server.registerTool(
        'blockClient',
        {
            description: 'Block a client from network access through the official Omada Open API.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'blockClient',
            ({ clientMac, siteId }, result, mode) => ({
                action: 'block-client',
                target: clientMac,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? `Planned client block for ${clientMac}.` : `Client block requested for ${clientMac}.`,
                result,
            }),
            async ({ clientMac, siteId, customHeaders, dryRun }) => {
                if (dryRun) {
                    return { accepted: true, dryRun: true };
                }
                return await client.blockClient(clientMac, siteId, customHeaders);
            }
        )
    );
}
