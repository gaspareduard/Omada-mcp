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

export function registerRestoreControllerFromFileServerTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        serverConfig: fileServerConfigSchema.describe('File server connection details.'),
        filePath: z.string().min(1).describe('Path to the backup file on the file server.'),
        skipDevice: z.boolean().describe('If true, skip restoring device configurations.'),
        dryRun: z.boolean().optional().default(false).describe('If true, return the planned action without executing it.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'restoreControllerFromFileServer',
        {
            description:
                'Restore controller configuration from a backup file stored on an external file server (FTP/SFTP). This will overwrite current controller settings. Use getRestoreResult to poll the restore status.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'restoreControllerFromFileServer',
            ({ filePath, skipDevice }, result, mode) => ({
                action: 'restore-controller-file-server',
                target: filePath,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary:
                    mode === 'dry-run'
                        ? `Planned controller restore from file server at "${filePath}" (skipDevice=${skipDevice}).`
                        : `Controller restore from file server initiated from "${filePath}" (skipDevice=${skipDevice}).`,
                result,
            }),
            async ({ serverConfig, filePath, skipDevice, dryRun, customHeaders }) => {
                if (dryRun) {
                    return { accepted: true, dryRun: true, filePath, skipDevice };
                }
                return await client.restoreControllerFromFileServer(serverConfig, filePath, skipDevice, customHeaders);
            }
        )
    );
}
