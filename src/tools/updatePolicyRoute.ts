import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { policyRoutingConfigSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    policyRoutingId: z.string().trim().min(1).describe('Policy route ID from listPolicyRoutes.'),
    payload: policyRoutingConfigSchema.describe(
        'Complete policy route (official PolicyRoutingConfig). Read the current record first and send every field you want to keep.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listPolicyRoutes' | 'updatePolicyRoute'>;

export function registerUpdatePolicyRouteTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updatePolicyRoute',
        {
            description:
                'Replace an existing policy route, e.g. to enable/disable it or retarget the WAN/VPN. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updatePolicyRoute',
            mutationSummary('update-policy-route', (args) => String(args.policyRoutingId)),
            async ({ policyRoutingId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'policy route',
                        list: () => client.listPolicyRoutes(siteId, customHeaders),
                    },
                    id: policyRoutingId,
                    payload,
                    dryRun,
                    write: () => client.updatePolicyRoute(policyRoutingId, payload, siteId, customHeaders),
                })
        )
    );
}
