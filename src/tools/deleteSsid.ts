import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    wlanId: z.string().trim().min(1).describe('WLAN group ID (wlanId) containing the SSID.'),
    ssidId: z.string().trim().min(1).describe('SSID ID from getSsidList.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteSsid' | 'getSsidList'>;

export function registerDeleteSsidTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteSsid',
        {
            description:
                'Delete an SSID. Clients connected to it are disconnected. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteSsid',
            mutationSummary('delete-ssid', (args) => String(args.ssidId)),
            async ({ wlanId, ssidId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'SSID',
                        list: () => client.getSsidList(wlanId, siteId, customHeaders),
                        idKeys: ['ssidId', 'id'],
                        writeOnly: ['pskSetting', 'entSetting', 'ppskSetting'],
                    },
                    id: ssidId,
                    dryRun,
                    write: () => client.deleteSsid(wlanId, ssidId, siteId, customHeaders),
                    warnings: ['Clients connected to this SSID are disconnected.'],
                })
        )
    );
}
