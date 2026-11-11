import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, pick, requireByMac, runAction } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    deviceMac: deviceMacSchema.describe('MAC address of an adopted device from listDevices.'),
    enable: z.boolean().default(true).describe('true starts blinking the locate LED; false stops it.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listDevices' | 'locateDevice'>;

export function registerLocateDeviceTool(server: McpServer, client: Client): void {
    server.registerTool(
        'locateDevice',
        {
            description:
                'Blink (or stop blinking) the locate LED of an adopted gateway, switch or AP so it can be found physically. Does not affect traffic. Defaults to a preview; set dryRun:false to send.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'locateDevice',
            mutationSummary('locate-device', (args) => String(args.deviceMac)),
            async ({ deviceMac, enable, siteId, customHeaders, dryRun }) =>
                await runAction({
                    label: 'locate',
                    dryRun,
                    preflight: async () => ({
                        ...pick(requireByMac(await client.listDevices(siteId, customHeaders), deviceMac, 'device'), [
                            'mac',
                            'name',
                            'type',
                            'model',
                            'status',
                        ]),
                        locateEnable: enable,
                    }),
                    write: () => client.locateDevice(deviceMac, { locateEnable: enable }, siteId, customHeaders),
                })
        )
    );
}
