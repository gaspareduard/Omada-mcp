import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { createMdnsRuleOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    mdnsId: z.string().trim().min(1).describe('mDNS rule ID from listMdnsRules.'),
    payload: createMdnsRuleOpenApiVOSchema.describe(
        'Complete mDNS rule (official CreateMdnsRuleOpenApiVO). Read the current record first and send every field you want to keep.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listMdnsRules' | 'updateMdnsRule'>;

export function registerUpdateMdnsRuleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateMdnsRule',
        {
            description:
                'Replace an existing mDNS rule, e.g. to enable/disable it or change which networks are bridged. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateMdnsRule',
            mutationSummary('update-mdns-rule', (args) => String(args.mdnsId)),
            async ({ mdnsId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'mDNS rule',
                        list: () => client.listMdnsRules(siteId, customHeaders),
                    },
                    id: mdnsId,
                    payload,
                    dryRun,
                    write: () => client.updateMdnsRule(mdnsId, payload, siteId, customHeaders),
                })
        )
    );
}
