import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { lanDnsOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: lanDnsOpenApiVOSchema.describe(
        'LAN DNS rule (official LanDnsOpenApiVO). type 0 answers with ipAddresses, 1 maps to cname, 2 forwards to dnsServers. Controllers require at least one lanNetworkIds entry.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'createLanDnsRule' | 'listLanDnsRules'>;

export function registerCreateLanDnsRuleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createLanDnsRule',
        {
            description:
                'Create a LAN DNS rule (local DNS record: A/AAAA answer, CNAME, or conditional forward) served by the gateway to the selected LAN networks. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createLanDnsRule',
            mutationSummary('create-lan-dns-rule', (args) => String((args.payload as { name?: unknown } | undefined)?.name ?? 'LAN DNS rule')),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runCreate({
                    spec: {
                        label: 'LAN DNS rule',
                        list: () => client.listLanDnsRules(siteId, customHeaders),
                    },
                    payload,
                    dryRun,
                    write: () => client.createLanDnsRule(payload, siteId, customHeaders),
                })
        )
    );
}
