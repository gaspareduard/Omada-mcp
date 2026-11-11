import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { createWlanGroupOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: createWlanGroupOpenApiVOSchema.describe(
        "WLAN group (official CreateWlanGroupOpenApiVO). Set clone:true with clonedWlanId to copy another group's SSIDs."
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'createWlanGroup' | 'getWlanGroupList'>;

export function registerCreateWlanGroupTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createWlanGroup',
        {
            description:
                'Create a WLAN group (a set of SSIDs that APs can be assigned to with setApConfig configType wlan-group; UniFi AP groups). Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createWlanGroup',
            mutationSummary('create-wlan-group', (args) => String((args.payload as { name?: unknown } | undefined)?.name ?? 'WLAN group')),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runCreate({
                    spec: {
                        label: 'WLAN group',
                        list: () => client.getWlanGroupList(siteId, customHeaders),
                        idKeys: ['wlanId', 'id'],
                    },
                    payload,
                    dryRun,
                    write: () => client.createWlanGroup(payload, siteId, customHeaders),
                })
        )
    );
}
