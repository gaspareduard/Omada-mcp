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

const RESTORE_CONFIRMATION_WARNING = [
    'WARNING: This action is IRREVERSIBLE.',
    '',
    'Restoring the controller will overwrite ALL current settings including sites, devices, network configuration, and user accounts.',
    'If the restore fails or the backup is incompatible, the controller may become unresponsive and require a force recovery or factory reset to regain access.',
    '',
    'To confirm and execute, call this tool again with confirmDangerous: true.',
].join('\n');

export function registerRestoreControllerFromFileServerTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        serverConfig: fileServerConfigSchema.describe('File server connection details.'),
        filePath: z.string().min(1).describe('Path to the backup file on the file server.'),
        skipDevice: z.boolean().describe('If true, skip restoring device configurations.'),
        dryRun: z.boolean().optional().default(false).describe('If true, return the planned action without executing it.'),
        confirmDangerous: z
            .boolean()
            .optional()
            .default(false)
            .describe('Must be explicitly set to true to confirm execution. A second confirmation is required because this action is irreversible.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'restoreControllerFromFileServer',
        {
            description:
                'Restore controller configuration from a backup file stored on an external file server (FTP/SFTP). This will overwrite current controller settings. Use getRestoreResult to poll the restore status. REQUIRES explicit confirmDangerous: true — a second confirmation step is enforced because this action is irreversible.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler(
            'restoreControllerFromFileServer',
            async ({ serverConfig, filePath, skipDevice, dryRun, confirmDangerous, customHeaders }) => {
                if (dryRun) {
                    return toMutationResult({
                        action: 'restore-controller-file-server',
                        target: filePath,
                        mode: 'dry-run',
                        status: 'planned',
                        summary: `Planned controller restore from file server at "${filePath}" (skipDevice=${skipDevice}).`,
                        result: { accepted: true, dryRun: true, filePath, skipDevice },
                    });
                }

                if (!confirmDangerous) {
                    return toToolResult({
                        confirmationRequired: true,
                        tool: 'restoreControllerFromFileServer',
                        target: filePath,
                        warning: RESTORE_CONFIRMATION_WARNING,
                    });
                }

                const result = await client.restoreControllerFromFileServer(serverConfig, filePath, skipDevice, customHeaders);
                return toMutationResult({
                    action: 'restore-controller-file-server',
                    target: filePath,
                    mode: 'apply',
                    status: 'applied',
                    summary: `Controller restore from file server initiated from "${filePath}" (skipDevice=${skipDevice}).`,
                    result,
                });
            }
        )
    );
}
