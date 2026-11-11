import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { ipsInfoSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runSettings } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: ipsInfoSchema.describe('IDS/IPS setting (official IpsInfo).'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'getIpsConfig' | 'setIpsConfig'>;

export function registerSetIpsConfigTool(server: McpServer, client: Client): void {
    server.registerTool(
        'setIpsConfig',
        {
            description:
                'Enable or disable gateway IDS/IPS (threat management). Inspection adds gateway load and can reduce throughput. Defaults to a preview of the current settings and differences; set dryRun:false to apply once and verify by readback.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'setIpsConfig',
            mutationSummary('set-ips-config', (args) => args.siteId ?? 'default-site'),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runSettings({
                    label: 'IDS/IPS',
                    read: () => client.getIpsConfig(siteId, customHeaders),
                    payload,
                    dryRun,
                    write: () => client.setIpsConfig(payload, siteId, customHeaders),
                    warnings: ['IDS/IPS inspection adds gateway load and can reduce throughput.'],
                })
        )
    );
}
