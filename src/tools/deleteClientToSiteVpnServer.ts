import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    vpnId: z.string().trim().min(1).describe('Client-to-site VPN server ID from listClientToSiteVpnServers.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteClientToSiteVpnServer' | 'listClientToSiteVpnServers'>;

export function registerDeleteClientToSiteVpnServerTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteClientToSiteVpnServer',
        {
            description:
                'Delete a client-to-site VPN server. Remote users can no longer connect. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteClientToSiteVpnServer',
            mutationSummary('delete-client-to-site-vpn-server', (args) => String(args.vpnId)),
            async ({ vpnId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'client-to-site VPN server',
                        list: () => client.listClientToSiteVpnServers(siteId, customHeaders),
                        writeOnly: ['preSharedKey', 'accountPassword'],
                    },
                    id: vpnId,
                    dryRun,
                    write: () => client.deleteClientToSiteVpnServer(vpnId, siteId, customHeaders),
                    warnings: ['Remote users can no longer connect through this server.'],
                })
        )
    );
}
