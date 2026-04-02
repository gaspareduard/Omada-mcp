import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';

export function registerRebootDeviceTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = siteInputSchema.extend({
        deviceMac: deviceMacSchema.describe('Device MAC address to reboot.'),
        dryRun: z.boolean().optional().default(false).describe('If true, return the planned action without sending it to the controller.'),
    });

    server.registerTool(
        'rebootDevice',
        {
            description: 'Reboot a managed device through the official Omada Open API.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'rebootDevice',
            ({ deviceMac, siteId }, result, mode) => ({
                action: 'reboot-device',
                target: deviceMac,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? `Planned reboot for device ${deviceMac}.` : `Reboot requested for device ${deviceMac}.`,
                result,
            }),
            async ({ deviceMac, siteId, customHeaders, dryRun }) => {
                if (dryRun) {
                    return { accepted: true, dryRun: true };
                }
                return await client.rebootDevice(deviceMac, siteId, customHeaders);
            }
        )
    );
}
