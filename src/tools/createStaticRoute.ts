import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { staticRoutingConfigSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: staticRoutingConfigSchema.describe(
        'Static route (official StaticRoutingConfig). routeType 0 uses nextHopIp; routeType 1 uses interfaceType/interfaceId (see getStaticRoutingInterfaceList).'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'createStaticRoute' | 'listStaticRoutes'>;

export function registerCreateStaticRouteTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createStaticRoute',
        {
            description:
                'Create a gateway static route to one or more destination subnets. Create it with status:false first if you want to review it before it takes effect. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createStaticRoute',
            mutationSummary('create-static-route', (args) => String((args.payload as { name?: unknown } | undefined)?.name ?? 'static route')),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runCreate({
                    spec: {
                        label: 'static route',
                        list: () => client.listStaticRoutes(siteId, customHeaders),
                    },
                    payload,
                    dryRun,
                    write: () => client.createStaticRoute(payload, siteId, customHeaders),
                    warnings: ['Enabled routes change live forwarding; review destinations and next hop.'],
                })
        )
    );
}
