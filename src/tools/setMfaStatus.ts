import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runSettings } from './resourceMutationShared.js';

const inputSchema = z.object({
    enable: z.boolean().describe('true turns controller two-factor authentication on; false turns it off.'),
    dryRun: dryRunSchema,
    customHeaders: customHeadersSchema,
});

type Client = Pick<OmadaClient, 'getMfaStatus' | 'setMfaStatus'>;

export function registerSetMfaStatusTool(server: McpServer, client: Client): void {
    server.registerTool(
        'setMfaStatus',
        {
            description:
                'Turn the controller-wide two-factor authentication requirement for web logins on or off. Defaults to a preview of the current status; set dryRun:false to apply once and verify by readback.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'setMfaStatus',
            mutationSummary('set-mfa-status', (args) => (args.enable ? 'enable' : 'disable')),
            async ({ enable, customHeaders, dryRun }) =>
                await runSettings({
                    label: 'two-factor authentication',
                    read: () => client.getMfaStatus(customHeaders),
                    payload: { enable },
                    dryRun,
                    write: () => client.setMfaStatus({ enable }, customHeaders),
                    warnings: enable
                        ? [
                              'Administrators without a working email or authenticator setup can be locked out of the web UI. Confirm the mail server first.',
                          ]
                        : ['Turning two-factor authentication off weakens protection of every controller login.'],
                })
        )
    );
}
