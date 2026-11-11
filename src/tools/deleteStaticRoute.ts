import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    staticRoutingId: z.string().trim().min(1).describe('Static route ID from listStaticRoutes.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteStaticRoute' | 'listStaticRoutes'>;

export function registerDeleteStaticRouteTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteStaticRoute',
        {
            description:
                'Delete a static route by ID. Traffic to its destinations falls back to other routes. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteStaticRoute',
            mutationSummary('delete-static-route', (args) => String(args.staticRoutingId)),
            async ({ staticRoutingId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'static route',
                        list: () => client.listStaticRoutes(siteId, customHeaders),
                    },
                    id: staticRoutingId,
                    dryRun,
                    write: () => client.deleteStaticRoute(staticRoutingId, siteId, customHeaders),
                })
        )
    );
}
