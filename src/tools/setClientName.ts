import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { clientNameSetting05Schema } from '../omadaClient/requestSchemas.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runSettings } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    clientMac: deviceMacSchema.describe('Client MAC address from listClients.'),
    name: clientNameSetting05Schema.shape.name.describe('New display name; an empty string clears the custom name.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'getClientDetail' | 'setClientName'>;

export function registerSetClientNameTool(server: McpServer, client: Client): void {
    server.registerTool(
        'setClientName',
        {
            description:
                'Rename a client (its display name in the controller). Does not affect connectivity. Defaults to a preview; set dryRun:false to apply and verify by readback.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'setClientName',
            mutationSummary('set-client-name', (args) => String(args.clientMac)),
            async ({ clientMac, name, siteId, customHeaders, dryRun }) =>
                await runSettings({
                    label: 'client name',
                    read: async () => {
                        const detail = (await client.getClientDetail(clientMac, siteId, customHeaders)) as Record<string, unknown> | undefined;
                        return detail && { mac: detail.mac, name: detail.name, hostName: detail.hostName };
                    },
                    payload: { name },
                    dryRun,
                    write: () => client.setClientName(clientMac, { name }, siteId, customHeaders),
                })
        )
    );
}
