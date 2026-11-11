import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { lanNetworkOpenApiV2VOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: lanNetworkOpenApiV2VOSchema.describe(
        'LAN network (official LanNetworkOpenApiV2VO). purpose 0 is a switch-only VLAN; purpose 1 is a gateway interface needing interfaceIds (getGatewayLanStatus), vlan and gatewaySubnet, with optional DHCP settings.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'createLanNetwork' | 'getLanNetworkList'>;

export function registerCreateLanNetworkTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createLanNetwork',
        {
            description:
                'Create a LAN network / VLAN (gateway interface with subnet and DHCP, or a switch-only VLAN) for segmentation. Gateways and switches re-provision. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createLanNetwork',
            mutationSummary('create-lan-network', (args) => String((args.payload as { name?: unknown } | undefined)?.name ?? 'LAN network')),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runCreate({
                    spec: {
                        label: 'LAN network',
                        list: () => client.getLanNetworkList(siteId, customHeaders),
                    },
                    payload,
                    dryRun,
                    write: () => client.createLanNetwork(payload, siteId, customHeaders),
                    warnings: ['Gateways and switches re-provision when networks change.'],
                })
        )
    );
}
