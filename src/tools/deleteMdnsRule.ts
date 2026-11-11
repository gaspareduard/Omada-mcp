import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    mdnsId: z.string().trim().min(1).describe('mDNS rule ID from listMdnsRules.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteMdnsRule' | 'listMdnsRules'>;

export function registerDeleteMdnsRuleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteMdnsRule',
        {
            description:
                'Delete an mDNS rule by ID. Cross-VLAN service discovery it provided stops. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteMdnsRule',
            mutationSummary('delete-mdns-rule', (args) => String(args.mdnsId)),
            async ({ mdnsId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'mDNS rule',
                        list: () => client.listMdnsRules(siteId, customHeaders),
                    },
                    id: mdnsId,
                    dryRun,
                    write: () => client.deleteMdnsRule(mdnsId, siteId, customHeaders),
                })
        )
    );
}
