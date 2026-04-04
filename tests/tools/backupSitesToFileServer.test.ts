import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerBackupSitesToFileServerTool } from '../../src/tools/backupSitesToFileServer.js';

const SERVER_CONFIG = { protocol: 'sftp', hostname: 'backup.local', port: 22 };

describe('tools/backupSitesToFileServer', () => {
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
            backupSitesToFileServer: vi.fn().mockResolvedValue(null),
        } as unknown as OmadaClient;
    });

    it('should register the backupSitesToFileServer tool', () => {
        registerBackupSitesToFileServerTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('backupSitesToFileServer', expect.any(Object), expect.any(Function));
    });

    it('should call backupSitesToFileServer with correct args', async () => {
        registerBackupSitesToFileServerTool(mockServer, mockClient);
        await toolHandler({ serverConfig: SERVER_CONFIG, filePath: '/backups/', siteIds: ['site-1'] }, { sessionId: 'test' });
        expect(mockClient.backupSitesToFileServer).toHaveBeenCalledWith(SERVER_CONFIG, '/backups/', ['site-1'], undefined);
    });

    it('should return dry-run summary without calling the controller', async () => {
        registerBackupSitesToFileServerTool(mockServer, mockClient);
        const result = (await toolHandler(
            { serverConfig: SERVER_CONFIG, filePath: '/backups/', siteIds: ['site-1'], dryRun: true },
            { sessionId: 'test' }
        )) as { content: { text: string }[] };
        expect(mockClient.backupSitesToFileServer).not.toHaveBeenCalled();
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.action).toBe('backup-sites-file-server');
        expect(parsed.mode).toBe('dry-run');
    });
});
