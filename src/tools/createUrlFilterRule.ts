import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { urlFilteringOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: urlFilteringOpenApiVOSchema.describe(
        'URL filtering rule (official UrlFilteringOpenApiVO). type \"gateway\" or \"ap\"; policy 0 drop, 1 allow; sourceType 0 network, 1 IP group, 2 SSID; filterMode 0 URL list, 1 category.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'createUrlFilterRule' | 'listUrlFilterRules'>;

export function registerCreateUrlFilterRuleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createUrlFilterRule',
        {
            description:
                'Create a gateway or AP URL/content filtering rule that blocks or allows URLs, keywords or categories for chosen networks, IP groups or SSIDs. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createUrlFilterRule',
            mutationSummary('create-url-filter-rule', (args) =>
                String((args.payload as { name?: unknown } | undefined)?.name ?? 'URL filtering rule')
            ),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runCreate({
                    spec: {
                        label: 'URL filtering rule',
                        list: () => client.listUrlFilterRules(payload.type === 'ap' ? 'eap' : 'gateway', siteId, customHeaders),
                    },
                    payload,
                    dryRun,
                    write: () => client.createUrlFilterRule(payload, siteId, customHeaders),
                })
        )
    );
}
