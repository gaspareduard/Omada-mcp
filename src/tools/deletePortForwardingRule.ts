import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    portForwardingId: z.string().trim().min(1).describe('Port forwarding rule ID from listPortForwardingRules.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deletePortForwarding' | 'listPortForwardingRules'>;

export function registerDeletePortForwardingRuleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deletePortForwardingRule',
        {
            description:
                'Delete a port forwarding rule by ID. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deletePortForwardingRule',
            mutationSummary('delete-port-forwarding-rule', (args) => String(args.portForwardingId)),
            async ({ portForwardingId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'port forwarding rule',
                        list: () => client.listPortForwardingRules(siteId, customHeaders),
                    },
                    id: portForwardingId,
                    dryRun,
                    write: () => client.deletePortForwarding(portForwardingId, siteId, customHeaders),
                })
        )
    );
}
