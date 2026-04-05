import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toMutationResult, toToolResult, wrapToolHandler } from '../server/common.js';

const fileServerConfigSchema = z.object({
    protocol: z.enum(['ftp', 'sftp']).describe('File server protocol.'),
    hostname: z.string().min(1).describe('File server hostname or IP address.'),
    port: z.number().int().min(1).max(65535).describe('File server port.'),
    username: z.string().optional().describe('Login username.'),
    password: z.string().optional().describe('Login password.'),
});

const siteFileRestoreInfoSchema = z.object({
    filePath: z.string().min(1).describe('Path to the backup file on the file server for this site.'),
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

export function registerRestoreSitesFromFileServerTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        serverConfig: fileServerConfigSchema.describe('File server connection details.'),
        siteInfos: z
            .array(siteFileRestoreInfoSchema)
            .min(1)
            .max(300)
            .describe('List of site restore entries, each pairing a site ID with the file path on the file server (up to 300).'),
        dryRun: z.boolean().optional().default(false).describe('If true, return the planned action without executing it.'),
        confirmDangerous: z
            .boolean()
            .optional()
            .default(false)
            .describe('Must be explicitly set to true to confirm execution. A second confirmation is required because this action is irreversible.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'restoreSitesFromFileServer',
        {
            description:
                'Restore multiple site configurations from backup files stored on an external file server (FTP/SFTP, up to 300 sites). REQUIRES explicit confirmDangerous: true — a second confirmation step is enforced because this action is irreversible.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('restoreSitesFromFileServer', async ({ serverConfig, siteInfos, dryRun, confirmDangerous, customHeaders }) => {
            const targetSites = siteInfos.map((s: { siteId: string }) => s.siteId).join(', ');

            if (dryRun) {
                return toMutationResult({
                    action: 'restore-sites-file-server',
                    target: targetSites,
                    mode: 'dry-run',
                    status: 'planned',
                    summary: `Planned restore for ${siteInfos.length} site(s) from file server.`,
                    result: { accepted: true, dryRun: true, siteInfos },
                });
            }

            if (!confirmDangerous) {
                return toToolResult({
                    confirmationRequired: true,
                    tool: 'restoreSitesFromFileServer',
                    target: targetSites,
                    siteCount: siteInfos.length,
                    warning: RESTORE_CONFIRMATION_WARNING,
                });
            }

            const result = await client.restoreSitesFromFileServer(serverConfig, siteInfos, customHeaders);
            return toMutationResult({
                action: 'restore-sites-file-server',
                target: targetSites,
                mode: 'apply',
                status: 'applied',
                summary: `Restore from file server initiated for ${siteInfos.length} site(s).`,
                result,
            });
        })
    );
}
