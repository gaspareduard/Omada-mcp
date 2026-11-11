import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    dnsId: z.string().trim().min(1).describe('LAN DNS rule ID from getLanDnsRules.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteLanDnsRule' | 'listLanDnsRules'>;

export function registerDeleteLanDnsRuleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteLanDnsRule',
        {
            description: 'Delete a LAN DNS rule by ID. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteLanDnsRule',
            mutationSummary('delete-lan-dns-rule', (args) => String(args.dnsId)),
            async ({ dnsId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'LAN DNS rule',
                        list: () => client.listLanDnsRules(siteId, customHeaders),
                    },
                    id: dnsId,
                    dryRun,
                    write: () => client.deleteLanDnsRule(dnsId, siteId, customHeaders),
                })
        )
    );
}
