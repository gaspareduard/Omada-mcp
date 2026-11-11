import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    policyRoutingId: z.string().trim().min(1).describe('Policy route ID from listPolicyRoutes.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deletePolicyRoute' | 'listPolicyRoutes'>;

export function registerDeletePolicyRouteTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deletePolicyRoute',
        {
            description: 'Delete a policy route by ID. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deletePolicyRoute',
            mutationSummary('delete-policy-route', (args) => String(args.policyRoutingId)),
            async ({ policyRoutingId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'policy route',
                        list: () => client.listPolicyRoutes(siteId, customHeaders),
                    },
                    id: policyRoutingId,
                    dryRun,
                    write: () => client.deletePolicyRoute(policyRoutingId, siteId, customHeaders),
                })
        )
    );
}
