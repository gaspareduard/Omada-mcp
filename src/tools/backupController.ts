import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, wrapMutationToolHandler } from '../server/common.js';

export function registerBackupControllerTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        retainUser: z.boolean().describe('Whether to retain user account data in the backup.'),
        dryRun: z.boolean().optional().default(false).describe('If true, return the planned action without executing it.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'backupController',
        {
            description:
                'Trigger a controller configuration backup to the self/cloud server. Use getBackupResult to poll the backup status afterwards.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: false,
            },
        },
        wrapMutationToolHandler(
            'backupController',
            ({ retainUser }, result, mode) => ({
                action: 'backup-controller',
                target: 'controller',
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary:
                    mode === 'dry-run'
                        ? `Planned controller backup (retainUser=${retainUser}).`
                        : `Controller backup triggered (retainUser=${retainUser}).`,
                result,
            }),
            async ({ retainUser, dryRun, customHeaders }) => {
                if (dryRun) {
                    return { accepted: true, dryRun: true, retainUser };
                }
                return await client.backupController(retainUser, customHeaders);
            }
        )
    );
}
