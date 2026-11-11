import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    groupId: z.string().trim().min(1).describe('Voucher group ID from listVoucherGroups.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteVoucherGroup' | 'listVoucherGroups'>;

export function registerDeleteVoucherGroupTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteVoucherGroup',
        {
            description:
                'Delete a voucher group and revoke its unused vouchers. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteVoucherGroup',
            mutationSummary('delete-voucher-group', (args) => String(args.groupId)),
            async ({ groupId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'voucher group',
                        list: () => client.listVoucherGroups(siteId, customHeaders),
                    },
                    id: groupId,
                    dryRun,
                    write: () => client.deleteVoucherGroup(groupId, siteId, customHeaders),
                })
        )
    );
}
