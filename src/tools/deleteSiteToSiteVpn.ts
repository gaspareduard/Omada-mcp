import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    vpnId: z.string().trim().min(1).describe('Site-to-site VPN ID from listSiteToSiteVpns.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteSiteToSiteVpn' | 'listSiteToSiteVpns'>;

export function registerDeleteSiteToSiteVpnTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteSiteToSiteVpn',
        {
            description:
                'Delete a site-to-site VPN. Traffic between the sites stops. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteSiteToSiteVpn',
            mutationSummary('delete-site-to-site-vpn', (args) => String(args.vpnId)),
            async ({ vpnId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'site-to-site VPN',
                        list: () => client.listSiteToSiteVpns(siteId, customHeaders),
                        writeOnly: ['preSharedKey'],
                    },
                    id: vpnId,
                    dryRun,
                    write: () => client.deleteSiteToSiteVpn(vpnId, siteId, customHeaders),
                    warnings: ['Traffic carried by this tunnel stops.'],
                })
        )
    );
}
