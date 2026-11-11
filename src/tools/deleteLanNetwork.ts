import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    networkId: z.string().trim().min(1).describe('LAN network ID from getLanNetworkList.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteLanNetwork' | 'getLanNetworkList'>;

export function registerDeleteLanNetworkTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteLanNetwork',
        {
            description:
                'Delete a LAN network. The primary network is refused; clients on the network lose connectivity. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteLanNetwork',
            mutationSummary('delete-lan-network', (args) => String(args.networkId)),
            async ({ networkId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'LAN network',
                        list: () => client.getLanNetworkList(siteId, customHeaders),
                    },
                    id: networkId,
                    dryRun,
                    write: () => client.deleteLanNetwork(networkId, siteId, customHeaders),
                    guard: (record) => {
                        if (record.primary === true) throw new Error('The primary LAN network cannot be deleted.');
                    },
                    warnings: ['Clients on this network lose connectivity.'],
                })
        )
    );
}
