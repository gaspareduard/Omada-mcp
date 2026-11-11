import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { createSsidOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    wlanId: z.string().trim().min(1).describe('WLAN group ID (wlanId) from getWlanGroupList that the SSID belongs to.'),
    payload: createSsidOpenApiVOSchema.describe(
        'SSID (official CreateSsidOpenApiVO). security: 0 open, 2 WPA-Enterprise, 3 WPA-Personal (pskSetting), 4 PPSK. vlanEnable with vlanSetting maps the SSID to a VLAN/network. Security settings are write-only and are not verified by readback.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'createSsid' | 'getSsidList'>;

export function registerCreateSsidTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createSsid',
        {
            description:
                'Create an SSID in a WLAN group, optionally mapped to a VLAN for segmentation. APs using the group start broadcasting it after provisioning, which can briefly interrupt their radios. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createSsid',
            mutationSummary('create-ssid', (args) => String((args.payload as { name?: unknown } | undefined)?.name ?? 'SSID')),
            async ({ wlanId, payload, siteId, customHeaders, dryRun }) =>
                await runCreate({
                    spec: {
                        label: 'SSID',
                        list: () => client.getSsidList(wlanId, siteId, customHeaders),
                        idKeys: ['ssidId', 'id'],
                        writeOnly: ['pskSetting', 'entSetting', 'ppskSetting'],
                    },
                    payload,
                    dryRun,
                    write: () => client.createSsid(wlanId, payload, siteId, customHeaders),
                    warnings: ['APs using this WLAN group re-provision their radios, which can briefly disconnect wireless clients.'],
                })
        )
    );
}
