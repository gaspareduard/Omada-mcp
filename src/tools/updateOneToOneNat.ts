import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { otoNatOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    otonatId: z.string().trim().min(1).describe('One-to-one NAT rule ID from getGridOtoNats.'),
    payload: otoNatOpenApiVOSchema.describe(
        'Complete one-to-one NAT rule (official OtoNatOpenApiVO). Read the current record first and send every field you want to keep.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listOneToOneNats' | 'updateOneToOneNat'>;

export function registerUpdateOneToOneNatTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateOneToOneNat',
        {
            description:
                'Replace an existing one-to-one NAT rule. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateOneToOneNat',
            mutationSummary('update-one-to-one-nat', (args) => String(args.otonatId)),
            async ({ otonatId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'one-to-one NAT rule',
                        list: () => client.listOneToOneNats(siteId, customHeaders),
                    },
                    id: otonatId,
                    payload,
                    dryRun,
                    write: () => client.updateOneToOneNat(otonatId, payload, siteId, customHeaders),
                })
        )
    );
}
