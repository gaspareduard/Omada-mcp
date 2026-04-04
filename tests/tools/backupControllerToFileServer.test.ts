import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerBackupControllerToFileServerTool } from '../../src/tools/backupControllerToFileServer.js';

const SERVER_CONFIG = { protocol: 'sftp', hostname: 'backup.local', port: 22 };

describe('tools/backupControllerToFileServer', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((_name, _schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = {
            backupControllerToFileServer: vi.fn().mockResolvedValue(null),
        } as unknown as OmadaClient;
    });

    it('should register the backupControllerToFileServer tool', () => {
        registerBackupControllerToFileServerTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('backupControllerToFileServer', expect.any(Object), expect.any(Function));
    });

    it('should call backupControllerToFileServer with correct args', async () => {
        registerBackupControllerToFileServerTool(mockServer, mockClient);
        await toolHandler({ serverConfig: SERVER_CONFIG, filePath: '/backups/ctrl.bak', retainUser: true }, { sessionId: 'test' });
        expect(mockClient.backupControllerToFileServer).toHaveBeenCalledWith(SERVER_CONFIG, '/backups/ctrl.bak', true, undefined);
    });

    it('should return dry-run summary without calling the controller', async () => {
        registerBackupControllerToFileServerTool(mockServer, mockClient);
        const result = (await toolHandler(
            { serverConfig: SERVER_CONFIG, filePath: '/backups/ctrl.bak', retainUser: false, dryRun: true },
            { sessionId: 'test' }
        )) as { content: { text: string }[] };
        expect(mockClient.backupControllerToFileServer).not.toHaveBeenCalled();
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.action).toBe('backup-controller-file-server');
        expect(parsed.mode).toBe('dry-run');
    });
});
