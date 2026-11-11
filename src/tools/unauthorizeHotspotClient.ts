import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, pick, runAction } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    clientMac: deviceMacSchema.describe('Client MAC address from listClients.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'getClientDetail' | 'unauthorizeHotspotClient'>;

export function registerUnauthorizeHotspotClientTool(server: McpServer, client: Client): void {
    server.registerTool(
        'unauthorizeHotspotClient',
        {
            description:
                'Revoke hotspot (captive portal) authorization for a client; it must pass the portal again. Defaults to a preview; set dryRun:false to send. The API reports acceptance only.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'unauthorizeHotspotClient',
            mutationSummary('unauthorize-hotspot-client', (args) => String(args.clientMac)),
            async ({ clientMac, siteId, customHeaders, dryRun }) =>
                await runAction({
                    label: 'hotspot unauthorize',
                    dryRun,
                    preflight: async () => {
                        const detail = (await client.getClientDetail(clientMac, siteId, customHeaders)) as Record<string, unknown> | undefined;
                        if (!detail || typeof detail !== 'object')
                            throw new Error(`No client with MAC ${clientMac} exists in this site. No request was sent.`);
                        return pick(detail, ['mac', 'name', 'ip', 'ssid', 'guest', 'authStatus']);
                    },
                    write: () => client.unauthorizeHotspotClient(clientMac, siteId, customHeaders),
                    warnings: ['The client loses internet access until it re-authenticates through the portal.'],
                })
        )
    );
}
