import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { lanProfileConfigOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: lanProfileConfigOpenApiVOSchema.describe(
        'Switch port profile (official LanProfileConfigOpenApiVO): native (untagged) network, tagged networks, PoE, 802.1X, port isolation, STP, loopback detection.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'createLanProfile' | 'getLanProfileList'>;

export function registerCreateLanProfileTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createLanProfile',
        {
            description:
                'Create a switch port profile (native VLAN, tagged VLANs, isolation, PoE, STP). Assign it to ports with setSwitchPorts. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createLanProfile',
            mutationSummary('create-lan-profile', (args) => String((args.payload as { name?: unknown } | undefined)?.name ?? 'LAN profile')),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runCreate({
                    spec: {
                        label: 'LAN profile',
                        list: () => client.getLanProfileList(siteId, customHeaders),
                    },
                    payload,
                    dryRun,
                    write: () => client.createLanProfile(payload, siteId, customHeaders),
                })
        )
    );
}
