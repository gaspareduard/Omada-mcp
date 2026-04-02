import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';

export function registerSetDeviceLedTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = siteInputSchema.extend({
        deviceMac: deviceMacSchema.describe('Device MAC address to update.'),
        ledSetting: z.number().int().min(0).max(2).describe('LED setting. 0=off, 1=on, 2=site-default as documented by the Omada controller.'),
        dryRun: z.boolean().optional().default(false).describe('If true, return the planned action without sending it to the controller.'),
    });

    server.registerTool(
        'setDeviceLed',
        {
            description: 'Change the LED state for a managed device through the official Omada Open API.',
            inputSchema: inputSchema.shape,
        },
        wrapMutationToolHandler(
            'setDeviceLed',
            ({ deviceMac, ledSetting, siteId }, result, mode) => ({
                action: 'set-device-led',
                target: deviceMac,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary:
                    mode === 'dry-run'
                        ? `Planned LED setting ${ledSetting} for device ${deviceMac}.`
                        : `LED setting ${ledSetting} requested for device ${deviceMac}.`,
                result,
            }),
            async ({ deviceMac, ledSetting, siteId, customHeaders, dryRun }) => {
                if (dryRun) {
                    return { accepted: true, dryRun: true, ledSetting };
                }
                return await client.setDeviceLed(deviceMac, ledSetting, siteId, customHeaders);
            }
        )
    );
}
