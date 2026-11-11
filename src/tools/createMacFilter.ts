import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { macFilteringSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: macFilteringSchema.describe(
        'Gateway MAC filtering entry (official MacFiltering). filterMode 0 allow, 1 deny; type 0 lists macAddresses, 1 references MAC group IDs.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'createMacFilter' | 'listMacFilters'>;

export function registerCreateMacFilterTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createMacFilter',
        {
            description:
                'Create a gateway MAC filtering allow/deny entry (UniFi MAC ACL). Takes effect when MAC filtering is enabled (getMacFilteringGeneralSetting); a deny entry blocks the listed devices. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createMacFilter',
            mutationSummary('create-mac-filter', (args) => String((args.payload as { name?: unknown } | undefined)?.name ?? 'MAC filtering entry')),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runCreate({
                    spec: {
                        label: 'MAC filtering entry',
                        list: () =>
                            client
                                .listMacFilters('allow', siteId, customHeaders)
                                .then(async (allow) => [...allow, ...(await client.listMacFilters('deny', siteId, customHeaders))]),
                    },
                    payload,
                    dryRun,
                    write: () => client.createMacFilter(payload, siteId, customHeaders),
                    warnings: ['When MAC filtering is enabled, deny entries block the listed devices and allow lists block everything else.'],
                })
        )
    );
}
