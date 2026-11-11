import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { lanDnsPayloadSchema } from './payloadRequirements.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    dnsId: z.string().trim().min(1).describe('LAN DNS rule ID from getLanDnsRules.'),
    payload: lanDnsPayloadSchema.describe(
        'Complete LAN DNS rule (official LanDnsOpenApiVO). Read the current record first and send every field you want to keep.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listLanDnsRules' | 'updateLanDnsRule'>;

export function registerUpdateLanDnsRuleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateLanDnsRule',
        {
            description:
                'Replace an existing LAN DNS rule. The preview lists fields that differ from the current rule. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateLanDnsRule',
            mutationSummary('update-lan-dns-rule', (args) => String(args.dnsId)),
            async ({ dnsId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'LAN DNS rule',
                        list: () => client.listLanDnsRules(siteId, customHeaders),
                    },
                    id: dnsId,
                    payload,
                    dryRun,
                    write: () => client.updateLanDnsRule(dnsId, payload, siteId, customHeaders),
                })
        )
    );
}
