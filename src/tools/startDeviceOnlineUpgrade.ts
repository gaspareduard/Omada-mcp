import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, pick, requireByMac, runAction } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    deviceMac: deviceMacSchema.describe('MAC address of an adopted device from listDevices.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listDevices' | 'getFirmwareInfo' | 'startDeviceOnlineUpgrade'>;

export function registerStartDeviceOnlineUpgradeTool(server: McpServer, client: Client): void {
    server.registerTool(
        'startDeviceOnlineUpgrade',
        {
            description:
                'Upgrade one adopted device to the latest firmware the controller offers online. Refused when getFirmwareInfo reports no newer version. The device reboots and its clients lose connectivity for several minutes. Defaults to a preview; set dryRun:false to start.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'startDeviceOnlineUpgrade',
            mutationSummary('start-device-online-upgrade', (args) => String(args.deviceMac)),
            async ({ deviceMac, siteId, customHeaders, dryRun }) =>
                await runAction({
                    label: 'firmware upgrade',
                    dryRun,
                    preflight: async () => {
                        const device = requireByMac(await client.listDevices(siteId, customHeaders), deviceMac, 'device');
                        const firmware = (await client.getFirmwareInfo(deviceMac, siteId, customHeaders)) as {
                            curFwVer?: unknown;
                            lastFwVer?: unknown;
                        };
                        if (typeof firmware?.lastFwVer !== 'string' || firmware.lastFwVer === '' || firmware.lastFwVer === firmware.curFwVer) {
                            throw new Error('The controller reports no newer online firmware for this device. No request was sent.');
                        }
                        return {
                            ...pick(device, ['mac', 'name', 'type', 'model', 'status']),
                            currentFirmware: firmware.curFwVer,
                            targetFirmware: firmware.lastFwVer,
                        };
                    },
                    write: () => client.startDeviceOnlineUpgrade(deviceMac, siteId, customHeaders),
                    warnings: ['The device reboots during the upgrade; its clients lose connectivity for several minutes.'],
                })
        )
    );
}
