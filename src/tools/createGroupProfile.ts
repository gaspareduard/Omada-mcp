import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { createGroupOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: createGroupOpenApiVOSchema.describe(
        'Group profile (official CreateGroupOpenApiVO). type 0 needs ipList, 1 needs ipList+portType+portList/portMaskList, 2 needs macAddressList, 3/4 need ipv6List, 5 countryList, 7 domainNamePort.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'createGroupProfile' | 'listGroupProfiles'>;

export function registerCreateGroupProfileTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createGroupProfile',
        {
            description:
                'Create an IP, IP-port, MAC, IPv6, country, or domain group used as a source/destination in ACLs, policy routes, URL filters and MAC filters (UniFi firewall/client groups). Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createGroupProfile',
            mutationSummary('create-group-profile', (args) => String((args.payload as { name?: unknown } | undefined)?.name ?? 'group profile')),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runCreate({
                    spec: {
                        label: 'group profile',
                        list: () => client.listGroupProfiles(undefined, siteId, customHeaders),
                        idKeys: ['groupId', 'id'],
                    },
                    payload,
                    dryRun,
                    write: () => client.createGroupProfile(payload, siteId, customHeaders),
                })
        )
    );
}
