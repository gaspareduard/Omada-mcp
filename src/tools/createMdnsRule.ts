import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { createMdnsRuleOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: createMdnsRuleOpenApiVOSchema.describe(
        'mDNS reflector rule (official CreateMdnsRuleOpenApiVO). profileIds come from listMdnsProfile (Bonjour services). type 1 (gateway) uses osg.serviceNetworks/clientNetworks LAN network IDs; type 0 (AP) uses ap.serviceVlan/clientVlan.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'createMdnsRule' | 'listMdnsRules'>;

export function registerCreateMdnsRuleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createMdnsRule',
        {
            description:
                'Create an mDNS (Bonjour) reflector rule so services such as AirPlay or Chromecast in one VLAN are discoverable from another. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createMdnsRule',
            mutationSummary('create-mdns-rule', (args) => String((args.payload as { name?: unknown } | undefined)?.name ?? 'mDNS rule')),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runCreate({
                    spec: {
                        label: 'mDNS rule',
                        list: () => client.listMdnsRules(siteId, customHeaders),
                    },
                    payload,
                    dryRun,
                    write: () => client.createMdnsRule(payload, siteId, customHeaders),
                })
        )
    );
}
