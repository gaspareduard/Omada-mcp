import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { updateWlanGroupOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    wlanId: z.string().trim().min(1).describe('WLAN group ID (wlanId) from getWlanGroupList.'),
    payload: updateWlanGroupOpenApiVOSchema.describe('WLAN group rename (official UpdateWlanGroupOpenApiVO).'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'getWlanGroupList' | 'updateWlanGroup'>;

export function registerUpdateWlanGroupTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateWlanGroup',
        {
            description:
                'Rename an existing WLAN group. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateWlanGroup',
            mutationSummary('update-wlan-group', (args) => String(args.wlanId)),
            async ({ wlanId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'WLAN group',
                        list: () => client.getWlanGroupList(siteId, customHeaders),
                        idKeys: ['wlanId', 'id'],
                    },
                    id: wlanId,
                    payload,
                    dryRun,
                    write: () => client.updateWlanGroup(wlanId, payload, siteId, customHeaders),
                })
        )
    );
}
