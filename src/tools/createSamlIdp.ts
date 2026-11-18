import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { idpMetadataOpenApiVO01Schema } from '../omadaClient/requestSchemas.js';
import { customHeadersSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = z.object({
    payload: idpMetadataOpenApiVO01Schema.describe(
        'SAML identity provider (official IdpMetadataOpenApiVO): name, unique entityId URL, loginUrl and x509Certificate = base64 of the complete PEM file (including the BEGIN/END CERTIFICATE lines).'
    ),
    dryRun: dryRunSchema,
    customHeaders: customHeadersSchema,
});

type Client = Pick<OmadaClient, 'createSamlIdp' | 'listSamlIdps'>;

export function registerCreateSamlIdpTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createSamlIdp',
        {
            description:
                'Add a SAML identity provider for controller single sign-on. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createSamlIdp',
            mutationSummary('create-saml-idp', (args) => String((args.payload as { name?: unknown }).name)),
            async ({ payload, customHeaders, dryRun }) =>
                await runCreate({
                    spec: { label: 'SAML identity provider', list: () => client.listSamlIdps(customHeaders), idKeys: ['id', 'idpId'] },
                    payload,
                    dryRun,
                    write: () => client.createSamlIdp(payload, customHeaders),
                })
        )
    );
}
