import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { idpMetadataOpenApiVO01Schema } from '../omadaClient/requestSchemas.js';
import { customHeadersSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = z.object({
    idpId: z.string().trim().min(1).describe('Identity provider ID (id) from listSamlIdps.'),
    payload: idpMetadataOpenApiVO01Schema.describe('Complete SAML identity provider (official IdpMetadataOpenApiVO).'),
    dryRun: dryRunSchema,
    customHeaders: customHeadersSchema,
});

type Client = Pick<OmadaClient, 'listSamlIdps' | 'updateSamlIdp'>;

export function registerUpdateSamlIdpTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateSamlIdp',
        {
            description:
                'Replace a SAML identity provider, e.g. to rotate its signing certificate or change its login URL. A wrong value breaks SSO logins. Defaults to a preview; set dryRun:false to apply once and verify by readback.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateSamlIdp',
            mutationSummary('update-saml-idp', (args) => String(args.idpId)),
            async ({ idpId, payload, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: { label: 'SAML identity provider', list: () => client.listSamlIdps(customHeaders), idKeys: ['id', 'idpId'] },
                    id: idpId,
                    payload,
                    dryRun,
                    write: () => client.updateSamlIdp(idpId, payload, customHeaders),
                })
        )
    );
}
