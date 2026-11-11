import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteToSiteVpnSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    vpnId: z.string().trim().min(1).describe('Site-to-site VPN ID from listSiteToSiteVpns.'),
    payload: siteToSiteVpnSchema.describe(
        'Site-to-site VPN fields to modify (official SiteToSiteVpn; name, siteVpnType and status are required). Omitted fields keep their current values. preSharedKey is write-only.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listSiteToSiteVpns' | 'updateSiteToSiteVpn'>;

export function registerUpdateSiteToSiteVpnTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateSiteToSiteVpn',
        {
            description:
                'Modify a site-to-site VPN, e.g. status:false to disable the tunnel. Tunnel traffic stops while it is down. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateSiteToSiteVpn',
            mutationSummary('update-site-to-site-vpn', (args) => String(args.vpnId)),
            async ({ vpnId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'site-to-site VPN',
                        list: () => client.listSiteToSiteVpns(siteId, customHeaders),
                        writeOnly: ['preSharedKey'],
                    },
                    id: vpnId,
                    payload,
                    dryRun,
                    write: () => client.updateSiteToSiteVpn(vpnId, payload, siteId, customHeaders),
                    warnings: ['Disabling or editing a tunnel interrupts traffic carried by it.'],
                })
        )
    );
}
