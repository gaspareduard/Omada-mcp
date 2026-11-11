import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    ruleId: z.string().trim().min(1).describe('URL filtering rule ID from getGridGatewayRule or getGridEapRule.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteUrlFilterRule' | 'listUrlFilterRules'>;

export function registerDeleteUrlFilterRuleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteUrlFilterRule',
        {
            description: 'Delete a URL filtering rule by ID. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteUrlFilterRule',
            mutationSummary('delete-url-filter-rule', (args) => String(args.ruleId)),
            async ({ ruleId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'URL filtering rule',
                        list: () =>
                            client
                                .listUrlFilterRules('gateway', siteId, customHeaders)
                                .then(async (gateway) => [...gateway, ...(await client.listUrlFilterRules('eap', siteId, customHeaders))]),
                    },
                    id: ruleId,
                    dryRun,
                    write: () => client.deleteUrlFilterRule(ruleId, siteId, customHeaders),
                })
        )
    );
}
