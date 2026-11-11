import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    otonatId: z.string().trim().min(1).describe('One-to-one NAT rule ID from getGridOtoNats.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteOneToOneNat' | 'listOneToOneNatRules'>;

export function registerDeleteOneToOneNatTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteOneToOneNat',
        {
            description: 'Delete a one-to-one NAT rule by ID. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteOneToOneNat',
            mutationSummary('delete-one-to-one-nat', (args) => String(args.otonatId)),
            async ({ otonatId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'one-to-one NAT rule',
                        list: () => client.listOneToOneNatRules(siteId, customHeaders),
                    },
                    id: otonatId,
                    dryRun,
                    write: () => client.deleteOneToOneNat(otonatId, siteId, customHeaders),
                })
        )
    );
}
