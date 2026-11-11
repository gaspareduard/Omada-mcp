import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, pick, runAction } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    clientMac: deviceMacSchema.describe('Client MAC address from listClients.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'getClientDetail' | 'authorizeHotspotClient'>;

export function registerAuthorizeHotspotClientTool(server: McpServer, client: Client): void {
    server.registerTool(
        'authorizeHotspotClient',
        {
            description:
                'Authorize a client on a hotspot (captive portal) network without it completing the portal, granting it internet access. Defaults to a preview; set dryRun:false to send. The API reports acceptance only.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'authorizeHotspotClient',
            mutationSummary('authorize-hotspot-client', (args) => String(args.clientMac)),
            async ({ clientMac, siteId, customHeaders, dryRun }) =>
                await runAction({
                    label: 'hotspot authorize',
                    dryRun,
                    preflight: async () => {
                        const detail = (await client.getClientDetail(clientMac, siteId, customHeaders)) as Record<string, unknown> | undefined;
                        if (!detail || typeof detail !== 'object')
                            throw new Error(`No client with MAC ${clientMac} exists in this site. No request was sent.`);
                        return pick(detail, ['mac', 'name', 'ip', 'ssid', 'guest', 'authStatus']);
                    },
                    write: () => client.authorizeHotspotClient(clientMac, siteId, customHeaders),
                    warnings: ['The client gains access governed by the portal limits.'],
                })
        )
    );
}
