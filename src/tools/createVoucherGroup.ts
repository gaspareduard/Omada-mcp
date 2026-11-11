import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { createVoucherGroupOpenApiVO06Schema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: createVoucherGroupOpenApiVO06Schema.describe(
        'Voucher group (official CreateVoucherGroupOpenApiVO): number of codes, code format/length, usage limits, duration and rate limits. Requires a hotspot portal that accepts vouchers.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'createVoucherGroup' | 'listVoucherGroups'>;

export function registerCreateVoucherGroupTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createVoucherGroup',
        {
            description:
                'Create a batch of hotspot guest vouchers. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createVoucherGroup',
            mutationSummary('create-voucher-group', (args) => String((args.payload as { name?: unknown } | undefined)?.name ?? 'voucher group')),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runCreate({
                    spec: {
                        label: 'voucher group',
                        list: () => client.listVoucherGroups(siteId, customHeaders),
                    },
                    payload,
                    dryRun,
                    write: () => client.createVoucherGroup(payload, siteId, customHeaders),
                })
        )
    );
}
