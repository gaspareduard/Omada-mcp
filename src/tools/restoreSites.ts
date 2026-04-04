import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, wrapMutationToolHandler } from '../server/common.js';

const siteRestoreInfoSchema = z.object({
    fileName: z.string().min(1).describe('Name of the backup file for this site (from getSiteBackupFileList).'),
    siteId: z.string().min(1).describe('ID of the site to restore.'),
});

export function registerRestoreSitesTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        siteRestoreInfos: z
            .array(siteRestoreInfoSchema)
            .min(1)
            .max(300)
            .describe('List of site restore entries, each pairing a site ID with its backup file name (up to 300).'),
        dryRun: z.boolean().optional().default(false).describe('If true, return the planned action without executing it.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'restoreSites',
        {
            description:
                'Restore multiple site configurations from backup files stored on the self/cloud server (up to 300 sites). Use getSiteBackupFileList to get available file names.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'restoreSites',
            ({ siteRestoreInfos }, result, mode) => ({
                action: 'restore-sites',
                target: siteRestoreInfos.map((s: { siteId: string }) => s.siteId).join(', '),
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary:
                    mode === 'dry-run'
                        ? `Planned restore for ${siteRestoreInfos.length} site(s).`
                        : `Restore initiated for ${siteRestoreInfos.length} site(s).`,
                result,
            }),
            async ({ siteRestoreInfos, dryRun, customHeaders }) => {
                if (dryRun) {
                    return { accepted: true, dryRun: true, siteRestoreInfos };
                }
                return await client.restoreSites(siteRestoreInfos, customHeaders);
            }
        )
    );
}
