import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toMutationResult, toToolResult, wrapToolHandler } from '../server/common.js';

const RESTORE_CONFIRMATION_WARNING = [
    'WARNING: This action is IRREVERSIBLE.',
    '',
    'Restoring the controller will overwrite ALL current settings including sites, devices, network configuration, and user accounts.',
    'If the restore fails or the backup is incompatible, the controller may become unresponsive and require a force recovery or factory reset to regain access.',
    '',
    'To confirm and execute, call this tool again with confirmDangerous: true.',
].join('\n');

export function registerRestoreControllerTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        fileName: z.string().min(1).describe('Name of the backup file to restore (from the self/cloud server file list).'),
        dryRun: z.boolean().optional().default(false).describe('If true, return the planned action without executing it.'),
        confirmDangerous: z
            .boolean()
            .optional()
            .default(false)
            .describe('Must be explicitly set to true to confirm execution. A second confirmation is required because this action is irreversible.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'restoreController',
        {
            description:
                'Restore controller configuration from a backup file stored on the self/cloud server. This will overwrite current controller settings. Use getBackupFileList to find available file names, and getRestoreResult to poll the restore status. REQUIRES explicit confirmDangerous: true — a second confirmation step is enforced because this action is irreversible.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('restoreController', async ({ fileName, dryRun, confirmDangerous, customHeaders }) => {
            if (dryRun) {
                return toMutationResult({
                    action: 'restore-controller',
                    target: fileName,
                    mode: 'dry-run',
                    status: 'planned',
                    summary: `Planned controller restore from backup file "${fileName}".`,
                    result: { accepted: true, dryRun: true, fileName },
                });
            }

            if (!confirmDangerous) {
                return toToolResult({
                    confirmationRequired: true,
                    tool: 'restoreController',
                    target: fileName,
                    warning: RESTORE_CONFIRMATION_WARNING,
                });
            }

            const result = await client.restoreController(fileName, customHeaders);
            return toMutationResult({
                action: 'restore-controller',
                target: fileName,
                mode: 'apply',
                status: 'applied',
                summary: `Controller restore initiated from backup file "${fileName}".`,
                result,
            });
        })
    );
}
