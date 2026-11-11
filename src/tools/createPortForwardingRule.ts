import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { portForwardingConfigSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: portForwardingConfigSchema.describe(
        'Port forwarding rule (official PortForwardingConfig). With dMZ:false, externalPort, forwardPort and protocol (0 all, 1 TCP, 2 UDP) are required by the controller.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'createPortForwarding' | 'listPortForwardingRules'>;

export function registerCreatePortForwardingRuleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createPortForwardingRule',
        {
            description:
                'Create a gateway port forwarding (DNAT) rule exposing a LAN host to the WAN. Exposes services to the internet when enabled; create with status:false to stage it. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createPortForwardingRule',
            mutationSummary('create-port-forwarding-rule', (args) =>
                String((args.payload as { name?: unknown } | undefined)?.name ?? 'port forwarding rule')
            ),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runCreate({
                    spec: {
                        label: 'port forwarding rule',
                        list: () => client.listPortForwardingRules(siteId, customHeaders),
                    },
                    payload,
                    dryRun,
                    write: () => client.createPortForwarding(payload, siteId, customHeaders),
                    warnings: ['Enabled port forwards expose the internal host to the internet.'],
                })
        )
    );
}
