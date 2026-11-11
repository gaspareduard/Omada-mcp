import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { createDdnsOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: createDdnsOpenApiVOSchema.describe(
        'Dynamic DNS entry (official CreateDdnsOpenApiVO). service: 0 DynDNS, 1 NO-IP, 2 Peanuthull, 3 Comexe, 4 Custom, 5 TP-Link DDNS. The password is write-only and cannot be verified by readback.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'createDdnsEntry' | 'listDdnsEntries'>;

export function registerCreateDdnsEntryTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createDdnsEntry',
        {
            description:
                'Create a dynamic DNS entry that keeps a hostname pointed at a gateway WAN address. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createDdnsEntry',
            mutationSummary('create-ddns-entry', (args) => String((args.payload as { name?: unknown } | undefined)?.name ?? 'dynamic DNS entry')),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runCreate({
                    spec: {
                        label: 'dynamic DNS entry',
                        list: () => client.listDdnsEntries(siteId, customHeaders),
                        nameKey: null,
                        writeOnly: ['password'],
                    },
                    payload,
                    dryRun,
                    write: () => client.createDdnsEntry(payload, siteId, customHeaders),
                })
        )
    );
}
