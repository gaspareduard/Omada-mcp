import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, wrapMutationToolHandler } from '../server/common.js';

export function registerRestoreControllerTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        fileName: z.string().min(1).describe('Name of the backup file to restore (from the self/cloud server file list).'),
        dryRun: z.boolean().optional().default(false).describe('If true, return the planned action without executing it.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'restoreController',
        {
            description:
                'Restore controller configuration from a backup file stored on the self/cloud server. This will overwrite current controller settings. Use getBackupFileList to find available file names, and getRestoreResult to poll the restore status.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'restoreController',
            ({ fileName }, result, mode) => ({
                action: 'restore-controller',
                target: fileName,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary:
                    mode === 'dry-run'
                        ? `Planned controller restore from backup file "${fileName}".`
                        : `Controller restore initiated from backup file "${fileName}".`,
                result,
            }),
            async ({ fileName, dryRun, customHeaders }) => {
                if (dryRun) {
                    return { accepted: true, dryRun: true, fileName };
                }
                return await client.restoreController(fileName, customHeaders);
            }
        )
    );
}
