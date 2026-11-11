import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    filterId: z.string().trim().min(1).describe('MAC filtering entry ID from getGridAllowMacFiltering or getGridDenyMacFiltering.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteMacFilter' | 'listMacFilters'>;

export function registerDeleteMacFilterTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteMacFilter',
        {
            description: 'Delete a MAC filtering entry by ID. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteMacFilter',
            mutationSummary('delete-mac-filter', (args) => String(args.filterId)),
            async ({ filterId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'MAC filtering entry',
                        list: () =>
                            client
                                .listMacFilters('allow', siteId, customHeaders)
                                .then(async (allow) => [...allow, ...(await client.listMacFilters('deny', siteId, customHeaders))]),
                    },
                    id: filterId,
                    dryRun,
                    write: () => client.deleteMacFilter(filterId, siteId, customHeaders),
                })
        )
    );
}
