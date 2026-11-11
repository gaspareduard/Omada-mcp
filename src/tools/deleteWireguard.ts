import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    wireguardId: z.string().trim().min(1).describe('WireGuard interface ID from listWireguard.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteWireguard' | 'listWireguardTunnels'>;

export function registerDeleteWireguardTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteWireguard',
        {
            description:
                'Delete a WireGuard interface. Its peers can no longer connect. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteWireguard',
            mutationSummary('delete-wireguard', (args) => String(args.wireguardId)),
            async ({ wireguardId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'WireGuard interface',
                        list: () => client.listWireguardTunnels(siteId, customHeaders),
                        writeOnly: ['privateKey'],
                    },
                    id: wireguardId,
                    dryRun,
                    write: () => client.deleteWireguard(wireguardId, siteId, customHeaders),
                })
        )
    );
}
