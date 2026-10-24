import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toMutationResult, toToolResult, wrapToolHandler } from '../server/common.js';

const siteRestoreInfoSchema = z.object({
    fileName: z.string().min(1).describe('Name of the backup file for this site (from getSiteBackupFileList).'),
    siteId: z.string().min(1).describe('ID of the site to restore.'),
});

const RESTORE_CONFIRMATION_WARNING = [
    'WARNING: This action is IRREVERSIBLE.',
    '',
    'Restoring site configurations will overwrite ALL current settings for the targeted sites including network configuration, device assignments, and security policies.',
    'If the restore fails or a backup is incompatible, affected sites may become unreachable and require manual recovery or a controller reset to regain access.',
    '',
    'To confirm and execute, call this tool again with confirmDangerous: true.',
].join('\n');

export function registerRestoreSitesTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        siteRestoreInfos: z
            .array(siteRestoreInfoSchema)
            .min(1)
            .max(300)
            .describe('List of site restore entries, each pairing a site ID with its backup file name (up to 300).'),
        dryRun: z.boolean().optional().default(true).describe('If true, return the planned action without executing it.'),
        confirmDangerous: z
            .boolean()
            .optional()
            .default(false)
            .describe(
                'Must be explicitly set to true to confirm execution. This boolean acknowledges the risk; human approval must be enforced by the MCP host.'
            ),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'restoreSites',
        {
            description:
                'Restore multiple site configurations from backup files stored on the self/cloud server (up to 300 sites). Use getSiteBackupFileList to get available file names. REQUIRES explicit confirmDangerous: true — this acknowledges the risk and is not a technical human-approval gate.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('restoreSites', async ({ siteRestoreInfos, dryRun, confirmDangerous, customHeaders }) => {
            const targetSites = siteRestoreInfos.map((s: { siteId: string }) => s.siteId).join(', ');

            if (dryRun !== false) {
                return toMutationResult({
                    action: 'restore-sites',
                    target: targetSites,
                    mode: 'dry-run',
                    status: 'planned',
                    summary: `Planned restore for ${siteRestoreInfos.length} site(s).`,
                    result: { accepted: true, dryRun: true, siteRestoreInfos },
                });
            }

            if (!confirmDangerous) {
                return toToolResult({
                    confirmationRequired: true,
                    tool: 'restoreSites',
                    target: targetSites,
                    siteCount: siteRestoreInfos.length,
                    warning: RESTORE_CONFIRMATION_WARNING,
                });
            }

            const result = await client.restoreSites(siteRestoreInfos, customHeaders);
            return toMutationResult({
                action: 'restore-sites',
                target: targetSites,
                mode: 'apply',
                status: 'applied',
                summary: `Restore initiated for ${siteRestoreInfos.length} site(s).`,
                result,
            });
        })
    );
}
