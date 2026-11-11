import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { macFilteringSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    filterId: z.string().trim().min(1).describe('MAC filtering entry ID from getGridAllowMacFiltering or getGridDenyMacFiltering.'),
    payload: macFilteringSchema.describe(
        'Complete MAC filtering entry (official MacFiltering). Read the current record first and send every field you want to keep.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listMacFilters' | 'updateMacFilter'>;

export function registerUpdateMacFilterTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateMacFilter',
        {
            description:
                'Replace an existing MAC filtering entry. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateMacFilter',
            mutationSummary('update-mac-filter', (args) => String(args.filterId)),
            async ({ filterId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'MAC filtering entry',
                        list: () =>
                            client
                                .listMacFilters('allow', siteId, customHeaders)
                                .then(async (allow) => [...allow, ...(await client.listMacFilters('deny', siteId, customHeaders))]),
                    },
                    id: filterId,
                    payload,
                    dryRun,
                    write: () => client.updateMacFilter(filterId, payload, siteId, customHeaders),
                })
        )
    );
}
