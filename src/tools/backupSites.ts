import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, wrapMutationToolHandler } from '../server/common.js';

export function registerBackupSitesTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        siteIds: z.array(z.string().min(1)).min(1).max(300).describe('List of site IDs to back up (up to 300).'),
        dryRun: z.boolean().optional().default(false).describe('If true, return the planned action without executing it.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'backupSites',
        {
            description:
                'Trigger a multi-site configuration backup to the self/cloud server (up to 300 sites). Use getSiteBackupResult to poll the backup status for a specific site.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: false,
            },
        },
        wrapMutationToolHandler(
            'backupSites',
            ({ siteIds }, result, mode) => ({
                action: 'backup-sites',
                target: siteIds.join(', '),
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? `Planned backup for ${siteIds.length} site(s).` : `Backup triggered for ${siteIds.length} site(s).`,
                result,
            }),
            async ({ siteIds, dryRun, customHeaders }) => {
                if (dryRun) {
                    return { accepted: true, dryRun: true, siteIds };
                }
                return await client.backupSites(siteIds, customHeaders);
            }
        )
    );
}
