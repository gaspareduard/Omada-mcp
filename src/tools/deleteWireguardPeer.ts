import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    peerId: z.string().trim().min(1).describe('WireGuard peer ID from listWireguardPeers.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteWireguardPeer' | 'listWireguardPeerEntries'>;

export function registerDeleteWireguardPeerTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteWireguardPeer',
        {
            description:
                'Delete a WireGuard peer. That remote device can no longer connect. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteWireguardPeer',
            mutationSummary('delete-wireguard-peer', (args) => String(args.peerId)),
            async ({ peerId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'WireGuard peer',
                        list: () => client.listWireguardPeerEntries(siteId, customHeaders),
                        nameKey: null,
                    },
                    id: peerId,
                    dryRun,
                    write: () => client.deleteWireguardPeer(peerId, siteId, customHeaders),
                })
        )
    );
}
