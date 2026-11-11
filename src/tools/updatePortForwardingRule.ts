import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { portForwardingConfigSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    portForwardingId: z.string().trim().min(1).describe('Port forwarding rule ID from listPortForwardingRules.'),
    payload: portForwardingConfigSchema.describe(
        'Complete port forwarding rule (official PortForwardingConfig). Read the current record first and send every field you want to keep.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listPortForwardingRules' | 'updatePortForwarding'>;

export function registerUpdatePortForwardingRuleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updatePortForwardingRule',
        {
            description:
                'Replace an existing port forwarding rule, e.g. to enable/disable it or change ports. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updatePortForwardingRule',
            mutationSummary('update-port-forwarding-rule', (args) => String(args.portForwardingId)),
            async ({ portForwardingId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'port forwarding rule',
                        list: () => client.listPortForwardingRules(siteId, customHeaders),
                    },
                    id: portForwardingId,
                    payload,
                    dryRun,
                    write: () => client.updatePortForwarding(portForwardingId, payload, siteId, customHeaders),
                    warnings: ['Enabled port forwards expose the internal host to the internet.'],
                })
        )
    );
}
