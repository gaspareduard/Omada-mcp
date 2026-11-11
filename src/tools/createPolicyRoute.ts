import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { policyRoutingConfigSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: policyRoutingConfigSchema.describe(
        'Policy route (official PolicyRoutingConfig): match sources/destinations (networks, IP or IP-port groups) and protocols, then egress via a WAN or VPN interface.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'createPolicyRoute' | 'listPolicyRoutes'>;

export function registerCreatePolicyRouteTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createPolicyRoute',
        {
            description:
                'Create a gateway policy-based route that steers matching traffic out of a chosen WAN or VPN (equivalent to UniFi traffic routes). Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createPolicyRoute',
            mutationSummary('create-policy-route', (args) => String((args.payload as { name?: unknown } | undefined)?.name ?? 'policy route')),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runCreate({
                    spec: {
                        label: 'policy route',
                        list: () => client.listPolicyRoutes(siteId, customHeaders),
                    },
                    payload,
                    dryRun,
                    write: () => client.createPolicyRoute(payload, siteId, customHeaders),
                })
        )
    );
}
