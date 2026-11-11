import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { staticRoutingConfigSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    staticRoutingId: z.string().trim().min(1).describe('Static route ID from listStaticRoutes.'),
    payload: staticRoutingConfigSchema.describe(
        'Complete static route (official StaticRoutingConfig). Read the current record first and send every field you want to keep.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listStaticRoutes' | 'updateStaticRoute'>;

export function registerUpdateStaticRouteTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateStaticRoute',
        {
            description:
                'Replace an existing static route, e.g. to enable/disable it or change its next hop. Changes affect live routing. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateStaticRoute',
            mutationSummary('update-static-route', (args) => String(args.staticRoutingId)),
            async ({ staticRoutingId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'static route',
                        list: () => client.listStaticRoutes(siteId, customHeaders),
                    },
                    id: staticRoutingId,
                    payload,
                    dryRun,
                    write: () => client.updateStaticRoute(staticRoutingId, payload, siteId, customHeaders),
                })
        )
    );
}
