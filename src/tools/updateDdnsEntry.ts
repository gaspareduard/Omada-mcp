import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { ddnsPayloadSchema, normalizeDdnsRecord } from './payloadRequirements.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    ddnsId: z.string().trim().min(1).describe('Dynamic DNS entry ID from getDdnsGrid.'),
    payload: ddnsPayloadSchema.describe(
        'Complete dynamic DNS entry (official CreateDdnsOpenApiVO), including the provider password, which reads never return.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listDdnsEntries' | 'updateDdnsEntry'>;

export function registerUpdateDdnsEntryTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateDdnsEntry',
        {
            description:
                'Replace an existing dynamic DNS entry. The provider password must be resent because reads never return it. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateDdnsEntry',
            mutationSummary('update-ddns-entry', (args) => String(args.ddnsId)),
            async ({ ddnsId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'dynamic DNS entry',
                        list: () => client.listDdnsEntries(siteId, customHeaders),
                        nameKey: null,
                        writeOnly: ['password'],
                        normalize: normalizeDdnsRecord,
                    },
                    id: ddnsId,
                    payload,
                    dryRun,
                    write: () => client.updateDdnsEntry(ddnsId, payload, siteId, customHeaders),
                })
        )
    );
}
