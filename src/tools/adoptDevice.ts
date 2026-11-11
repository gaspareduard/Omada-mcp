import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, pick, requireByMac, runAction } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    deviceMac: deviceMacSchema.describe('MAC address of a pending device from listPendingDevices.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listPendingDevices' | 'adoptDevice'>;

export function registerAdoptDeviceTool(server: McpServer, client: Client): void {
    server.registerTool(
        'adoptDevice',
        {
            description:
                'Adopt a pending (discovered, not yet managed) device into this site using its default login; devices with changed credentials must be adopted in the controller UI. The controller then provisions it with site configuration, which can reboot it. Defaults to a preview; set dryRun:false to send.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'adoptDevice',
            mutationSummary('adopt-device', (args) => String(args.deviceMac)),
            async ({ deviceMac, siteId, customHeaders, dryRun }) =>
                await runAction({
                    label: 'adoption',
                    dryRun,
                    preflight: async () =>
                        pick(requireByMac(await client.listPendingDevices(siteId, customHeaders), deviceMac, 'pending device'), [
                            'mac',
                            'name',
                            'type',
                            'model',
                            'ip',
                            'status',
                        ]),
                    // Credentials are never tool arguments (security model); adopt with the device's default login.
                    write: () => client.adoptDevice(deviceMac, {}, siteId, customHeaders),
                    warnings: ['Adoption provisions site configuration onto the device and can reboot it.'],
                })
        )
    );
}
