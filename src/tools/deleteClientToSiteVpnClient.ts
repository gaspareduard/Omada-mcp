import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    vpnId: z.string().trim().min(1).describe('Client-to-site VPN client ID from listClientToSiteVpnClients.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteClientToSiteVpnClient' | 'listClientToSiteVpnClientEntries'>;

export function registerDeleteClientToSiteVpnClientTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteClientToSiteVpnClient',
        {
            description:
                'Delete a gateway VPN client connection. Policy routes using it stop working. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteClientToSiteVpnClient',
            mutationSummary('delete-client-to-site-vpn-client', (args) => String(args.vpnId)),
            async ({ vpnId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'client-to-site VPN client',
                        list: () => client.listClientToSiteVpnClientEntries(siteId, customHeaders),
                        writeOnly: ['preSharedKey', 'clientPassword'],
                    },
                    id: vpnId,
                    dryRun,
                    write: () => client.deleteClientToSiteVpnClient(vpnId, siteId, customHeaders),
                })
        )
    );
}
