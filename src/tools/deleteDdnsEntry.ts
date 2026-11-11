import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    ddnsId: z.string().trim().min(1).describe('Dynamic DNS entry ID from getDdnsGrid.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteDdnsEntry' | 'listDdnsEntries'>;

export function registerDeleteDdnsEntryTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteDdnsEntry',
        {
            description: 'Delete a dynamic DNS entry by ID. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteDdnsEntry',
            mutationSummary('delete-ddns-entry', (args) => String(args.ddnsId)),
            async ({ ddnsId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'dynamic DNS entry',
                        list: () => client.listDdnsEntries(siteId, customHeaders),
                        nameKey: null,
                        writeOnly: ['password'],
                    },
                    id: ddnsId,
                    dryRun,
                    write: () => client.deleteDdnsEntry(ddnsId, siteId, customHeaders),
                })
        )
    );
}
