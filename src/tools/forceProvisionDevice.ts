import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, pick, requireByMac, runAction } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    deviceMac: deviceMacSchema.describe('MAC address of an adopted device from listDevices.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listDevices' | 'forceProvisionDevice'>;

export function registerForceProvisionDeviceTool(server: McpServer, client: Client): void {
    server.registerTool(
        'forceProvisionDevice',
        {
            description:
                'Force the controller to re-push the full configuration to an adopted device. The device can restart services or radios and briefly drop connected clients. Defaults to a preview; set dryRun:false to send.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'forceProvisionDevice',
            mutationSummary('force-provision-device', (args) => String(args.deviceMac)),
            async ({ deviceMac, siteId, customHeaders, dryRun }) =>
                await runAction({
                    label: 'force provision',
                    dryRun,
                    preflight: async () =>
                        pick(requireByMac(await client.listDevices(siteId, customHeaders), deviceMac, 'device'), [
                            'mac',
                            'name',
                            'type',
                            'model',
                            'status',
                        ]),
                    write: () => client.forceProvisionDevice(deviceMac, siteId, customHeaders),
                    warnings: ['Re-provisioning can restart device services or radios and briefly disconnect clients.'],
                })
        )
    );
}
