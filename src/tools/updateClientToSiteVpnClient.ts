import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { clientToSiteVpnClientSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    vpnId: z.string().trim().min(1).describe('Client-to-site VPN client ID from listClientToSiteVpnClients.'),
    payload: clientToSiteVpnClientSchema.describe(
        'Client-to-site VPN client fields to modify (official ClientToSiteVpnClient; clientVpnType, name and wan are required). Secrets are write-only.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listClientToSiteVpnClientEntries' | 'updateClientToSiteVpnClient'>;

export function registerUpdateClientToSiteVpnClientTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateClientToSiteVpnClient',
        {
            description:
                'Modify a gateway VPN client connection (the gateway dialing out to a VPN provider), e.g. disable it. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateClientToSiteVpnClient',
            mutationSummary('update-client-to-site-vpn-client', (args) => String(args.vpnId)),
            async ({ vpnId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'client-to-site VPN client',
                        list: () => client.listClientToSiteVpnClientEntries(siteId, customHeaders),
                        writeOnly: ['preSharedKey', 'clientPassword'],
                    },
                    id: vpnId,
                    payload,
                    dryRun,
                    write: () => client.updateClientToSiteVpnClient(vpnId, payload, siteId, customHeaders),
                    warnings: ['Traffic routed through this VPN client is interrupted while it reconnects.'],
                })
        )
    );
}
