import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, wrapMutationToolHandler } from '../server/common.js';

const fileServerConfigSchema = z.object({
    protocol: z.enum(['ftp', 'sftp']).describe('File server protocol.'),
    hostname: z.string().min(1).describe('File server hostname or IP address.'),
    port: z.number().int().min(1).max(65535).describe('File server port.'),
    username: z.string().optional().describe('Login username.'),
    password: z.string().optional().describe('Login password.'),
});

export function registerBackupSitesToFileServerTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        serverConfig: fileServerConfigSchema.describe('File server connection details.'),
        filePath: z.string().min(1).describe('Destination path on the file server where the backup will be stored.'),
        siteIds: z.array(z.string().min(1)).min(1).max(300).describe('List of site IDs to back up (up to 300).'),
        dryRun: z.boolean().optional().default(false).describe('If true, return the planned action without executing it.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'backupSitesToFileServer',
        {
            description:
                'Trigger a multi-site configuration backup to an external file server (FTP/SFTP, up to 300 sites). Use getSiteBackupResult to poll the backup status for a specific site.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: false,
            },
        },
        wrapMutationToolHandler(
            'backupSitesToFileServer',
            ({ siteIds, filePath }, result, mode) => ({
                action: 'backup-sites-file-server',
                target: filePath,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary:
                    mode === 'dry-run'
                        ? `Planned backup of ${siteIds.length} site(s) to file server at "${filePath}".`
                        : `Backup of ${siteIds.length} site(s) to file server triggered at "${filePath}".`,
                result,
            }),
            async ({ serverConfig, filePath, siteIds, dryRun, customHeaders }) => {
                if (dryRun) {
                    return { accepted: true, dryRun: true, filePath, siteIds };
                }
                return await client.backupSitesToFileServer(serverConfig, filePath, siteIds, customHeaders);
            }
        )
    );
}
