import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { wireguardOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    wireguardId: z.string().trim().min(1).describe('WireGuard interface ID from listWireguard.'),
    payload: wireguardOpenApiVOSchema.describe(
        'Complete WireGuard interface (official WireguardOpenApiVO). The privateKey must be resent because reads never return it.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listWireguardTunnels' | 'updateWireguard'>;

export function registerUpdateWireguardTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateWireguard',
        {
            description:
                'Replace a WireGuard interface, e.g. to enable/disable it or change its listen port. Peers reconnect. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateWireguard',
            mutationSummary('update-wireguard', (args) => String(args.wireguardId)),
            async ({ wireguardId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'WireGuard interface',
                        list: () => client.listWireguardTunnels(siteId, customHeaders),
                        writeOnly: ['privateKey'],
                    },
                    id: wireguardId,
                    payload,
                    dryRun,
                    write: () => client.updateWireguard(wireguardId, payload, siteId, customHeaders),
                    warnings: ['Peers on this interface are interrupted while it re-provisions.'],
                })
        )
    );
}
