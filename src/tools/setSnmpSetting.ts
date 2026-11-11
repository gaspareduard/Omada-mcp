import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { snmpSettingOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runSettings } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: snmpSettingOpenApiVOSchema.describe('SNMP setting (official SnmpSettingOpenApiVO).'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'getSnmpSetting' | 'setSnmpSetting'>;

export function registerSetSnmpSettingTool(server: McpServer, client: Client): void {
    server.registerTool(
        'setSnmpSetting',
        {
            description:
                'Enable or disable SNMPv1/v2c and SNMPv3 on site devices. The community string and v3 password are write-only and are not verified by readback. Defaults to a preview of the current settings and differences; set dryRun:false to apply once and verify by readback.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'setSnmpSetting',
            mutationSummary('set-snmp-setting', (args) => args.siteId ?? 'default-site'),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runSettings({
                    label: 'SNMP',
                    read: () => client.getSnmpSetting(siteId, customHeaders),
                    payload,
                    dryRun,
                    write: () => client.setSnmpSetting(payload, siteId, customHeaders),
                    writeOnly: ['communityString', 'password'],
                    warnings: ['SNMP exposes device information to anyone holding the community string or v3 credentials.'],
                })
        )
    );
}
