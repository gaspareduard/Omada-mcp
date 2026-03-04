import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        apMac: siteInputSchema.shape.siteId
            .unwrap()
            .describe('MAC address of the access point (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find AP MACs.'),
    })
    .required({ apMac: true });

export function registerGetApSnmpConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getApSnmpConfig',
        {
            description:
                'Get SNMP configuration for an access point. Returns SNMP version, community strings, trap settings, and enabled state. Useful for auditing SNMP-based monitoring configurations on wireless infrastructure.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getApSnmpConfig', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getApSnmpConfig(apMac, siteId, customHeaders))
        )
    );
}
