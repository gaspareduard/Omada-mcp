import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { lanNetworkOpenApiV2VOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    networkId: z.string().trim().min(1).describe('LAN network ID from getLanNetworkList.'),
    payload: lanNetworkOpenApiV2VOSchema.describe(
        'Complete LAN network (official LanNetworkOpenApiV2VO). Read the current record first and send every field you want to keep.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'getLanNetworkList' | 'updateLanNetwork'>;

export function registerUpdateLanNetworkTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateLanNetwork',
        {
            description:
                'Replace an existing LAN network (subnet, DHCP, VLAN, interfaces). Clients on the network can lose connectivity while devices re-provision. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateLanNetwork',
            mutationSummary('update-lan-network', (args) => String(args.networkId)),
            async ({ networkId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'LAN network',
                        list: () => client.getLanNetworkList(siteId, customHeaders),
                    },
                    id: networkId,
                    payload,
                    dryRun,
                    write: () => client.updateLanNetwork(networkId, payload, siteId, customHeaders),
                    warnings: ['Clients on this network can lose connectivity while devices re-provision.'],
                })
        )
    );
}
