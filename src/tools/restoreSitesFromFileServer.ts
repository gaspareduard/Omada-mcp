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

const siteFileRestoreInfoSchema = z.object({
    filePath: z.string().min(1).describe('Path to the backup file on the file server for this site.'),
    siteId: z.string().min(1).describe('ID of the site to restore.'),
});

export function registerRestoreSitesFromFileServerTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        serverConfig: fileServerConfigSchema.describe('File server connection details.'),
        siteInfos: z
            .array(siteFileRestoreInfoSchema)
            .min(1)
            .max(300)
            .describe('List of site restore entries, each pairing a site ID with the file path on the file server (up to 300).'),
        dryRun: z.boolean().optional().default(false).describe('If true, return the planned action without executing it.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'restoreSitesFromFileServer',
        {
            description: 'Restore multiple site configurations from backup files stored on an external file server (FTP/SFTP, up to 300 sites).',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'restoreSitesFromFileServer',
            ({ siteInfos }, result, mode) => ({
                action: 'restore-sites-file-server',
                target: siteInfos.map((s: { siteId: string }) => s.siteId).join(', '),
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary:
                    mode === 'dry-run'
                        ? `Planned restore for ${siteInfos.length} site(s) from file server.`
                        : `Restore from file server initiated for ${siteInfos.length} site(s).`,
                result,
            }),
            async ({ serverConfig, siteInfos, dryRun, customHeaders }) => {
                if (dryRun) {
                    return { accepted: true, dryRun: true, siteInfos };
                }
                return await client.restoreSitesFromFileServer(serverConfig, siteInfos, customHeaders);
            }
        )
    );
}
