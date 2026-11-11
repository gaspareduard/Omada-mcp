import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { urlFilteringOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    ruleId: z.string().trim().min(1).describe('URL filtering rule ID from getGridGatewayRule or getGridEapRule.'),
    payload: urlFilteringOpenApiVOSchema.describe(
        'Complete URL filtering rule (official UrlFilteringOpenApiVO). Read the current record first and send every field you want to keep.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listUrlFilterRules' | 'updateUrlFilterRule'>;

export function registerUpdateUrlFilterRuleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateUrlFilterRule',
        {
            description:
                'Replace an existing URL filtering rule, e.g. to enable/disable it. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateUrlFilterRule',
            mutationSummary('update-url-filter-rule', (args) => String(args.ruleId)),
            async ({ ruleId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'URL filtering rule',
                        list: () => client.listUrlFilterRules(payload.type === 'ap' ? 'eap' : 'gateway', siteId, customHeaders),
                    },
                    id: ruleId,
                    payload,
                    dryRun,
                    write: () => client.updateUrlFilterRule(ruleId, payload, siteId, customHeaders),
                })
        )
    );
}
