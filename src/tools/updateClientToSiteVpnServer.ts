import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { clientToSiteVpnServerSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    vpnId: z.string().trim().min(1).describe('Client-to-site VPN server ID from listClientToSiteVpnServers.'),
    payload: clientToSiteVpnServerSchema.describe(
        'Client-to-site VPN server fields to modify (official ClientToSiteVpnServer; clientVpnType, name, wan and ipPool are required). Secrets are write-only.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listClientToSiteVpnServers' | 'updateClientToSiteVpnServer'>;

export function registerUpdateClientToSiteVpnServerTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateClientToSiteVpnServer',
        {
            description:
                'Modify a client-to-site (remote access) VPN server, e.g. disable it. Connected remote users are dropped. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateClientToSiteVpnServer',
            mutationSummary('update-client-to-site-vpn-server', (args) => String(args.vpnId)),
            async ({ vpnId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'client-to-site VPN server',
                        list: () => client.listClientToSiteVpnServers(siteId, customHeaders),
                        writeOnly: ['preSharedKey'],
                    },
                    id: vpnId,
                    payload,
                    dryRun,
                    write: () => client.updateClientToSiteVpnServer(vpnId, payload, siteId, customHeaders),
                    warnings: ['Remote users connected to this server can be disconnected.'],
                })
        )
    );
}
