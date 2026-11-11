import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { otoNatOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: otoNatOpenApiVOSchema.describe(
        'One-to-one NAT rule (official OtoNatOpenApiVO) mapping an internal IP to an external IP on the selected WAN interfaces.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'createOneToOneNat' | 'listOneToOneNatRules'>;

export function registerCreateOneToOneNatTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createOneToOneNat',
        {
            description:
                'Create a one-to-one (static) NAT rule on the gateway. Enabled rules expose the internal host; create with status:false to stage it. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createOneToOneNat',
            mutationSummary('create-one-to-one-nat', (args) =>
                String((args.payload as { name?: unknown } | undefined)?.name ?? 'one-to-one NAT rule')
            ),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runCreate({
                    spec: {
                        label: 'one-to-one NAT rule',
                        list: () => client.listOneToOneNatRules(siteId, customHeaders),
                    },
                    payload,
                    dryRun,
                    write: () => client.createOneToOneNat(payload, siteId, customHeaders),
                })
        )
    );
}
