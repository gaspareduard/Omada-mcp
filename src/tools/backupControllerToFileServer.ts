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

export function registerBackupControllerToFileServerTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        serverConfig: fileServerConfigSchema.describe('File server connection details.'),
        filePath: z.string().min(1).describe('Destination path on the file server where the backup will be stored.'),
        retainUser: z.boolean().describe('Whether to retain user account data in the backup.'),
        dryRun: z.boolean().optional().default(false).describe('If true, return the planned action without executing it.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'backupControllerToFileServer',
        {
            description:
                'Trigger a controller configuration backup to an external file server (FTP/SFTP). Use getBackupResult to poll the backup status.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: false,
            },
        },
        wrapMutationToolHandler(
            'backupControllerToFileServer',
            ({ filePath }, result, mode) => ({
                action: 'backup-controller-file-server',
                target: filePath,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary:
                    mode === 'dry-run'
                        ? `Planned controller backup to file server at ${filePath}.`
                        : `Controller backup to file server triggered at ${filePath}.`,
                result,
            }),
            async ({ serverConfig, filePath, retainUser, dryRun, customHeaders }) => {
                if (dryRun) {
                    return { accepted: true, dryRun: true, filePath, retainUser };
                }
                return await client.backupControllerToFileServer(serverConfig, filePath, retainUser, customHeaders);
            }
        )
    );
}
