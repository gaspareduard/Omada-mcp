import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = z.object({
    idpId: z.string().trim().min(1).describe('Identity provider ID (id) from listSamlIdps.'),
    dryRun: dryRunSchema,
    customHeaders: customHeadersSchema,
});

type Client = Pick<OmadaClient, 'deleteSamlIdp' | 'listSamlIdps'>;

export function registerDeleteSamlIdpTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteSamlIdp',
        {
            description:
                'Delete a SAML identity provider; users who sign in through it lose SSO access. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteSamlIdp',
            mutationSummary('delete-saml-idp', (args) => String(args.idpId)),
            async ({ idpId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: { label: 'SAML identity provider', list: () => client.listSamlIdps(customHeaders), idKeys: ['id', 'idpId'] },
                    id: idpId,
                    dryRun,
                    write: () => client.deleteSamlIdp(idpId, customHeaders),
                })
        )
    );
}
