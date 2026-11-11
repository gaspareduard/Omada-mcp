import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { aLGSettingSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runSettings } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: aLGSettingSchema.describe('Complete ALG setting (official ALGSetting).'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'getAlg' | 'setAlgSetting'>;

export function registerSetAlgSettingTool(server: McpServer, client: Client): void {
    server.registerTool(
        'setAlgSetting',
        {
            description:
                'Enable or disable gateway application layer gateways (FTP, H.323, PPTP, SIP, IPsec passthrough). Defaults to a preview of the current settings and differences; set dryRun:false to apply once and verify by readback.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'setAlgSetting',
            mutationSummary('set-alg-setting', (args) => args.siteId ?? 'default-site'),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runSettings({
                    label: 'ALG',
                    read: () => client.getAlg(siteId, customHeaders),
                    payload,
                    dryRun,
                    write: () => client.setAlgSetting(payload, siteId, customHeaders),
                })
        )
    );
}
