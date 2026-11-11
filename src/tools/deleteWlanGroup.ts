import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    wlanId: z.string().trim().min(1).describe('WLAN group ID (wlanId) from getWlanGroupList.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteWlanGroup' | 'getWlanGroupList'>;

export function registerDeleteWlanGroupTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteWlanGroup',
        {
            description:
                'Delete a WLAN group. The primary group is refused; the controller refuses groups still assigned to APs. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteWlanGroup',
            mutationSummary('delete-wlan-group', (args) => String(args.wlanId)),
            async ({ wlanId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'WLAN group',
                        list: () => client.getWlanGroupList(siteId, customHeaders),
                        idKeys: ['wlanId', 'id'],
                    },
                    id: wlanId,
                    dryRun,
                    write: () => client.deleteWlanGroup(wlanId, siteId, customHeaders),
                    guard: (record) => {
                        if (record.primary === true) throw new Error('The primary WLAN group cannot be deleted.');
                    },
                })
        )
    );
}
