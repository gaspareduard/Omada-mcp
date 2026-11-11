import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { upnpSettingOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runSettings } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: upnpSettingOpenApiVOSchema.describe('UPnP setting (official UpnpSettingOpenApiVO).'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'getUpnpSetting' | 'setUpnpSetting'>;

export function registerSetUpnpSettingTool(server: McpServer, client: Client): void {
    server.registerTool(
        'setUpnpSetting',
        {
            description:
                'Enable or disable UPnP on the gateway. Enabling UPnP lets LAN devices open inbound ports automatically. Defaults to a preview of the current settings and differences; set dryRun:false to apply once and verify by readback.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'setUpnpSetting',
            mutationSummary('set-upnp-setting', (args) => args.siteId ?? 'default-site'),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runSettings({
                    label: 'UPnP',
                    read: () => client.getUpnpSetting(siteId, customHeaders),
                    payload,
                    dryRun,
                    write: () => client.setUpnpSetting(payload, siteId, customHeaders),
                    warnings: ['Enabling UPnP lets LAN devices open inbound ports without review.'],
                })
        )
    );
}
