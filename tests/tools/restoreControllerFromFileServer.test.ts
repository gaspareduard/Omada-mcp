import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerRestoreControllerFromFileServerTool } from '../../src/tools/restoreControllerFromFileServer.js';

const SERVER_CONFIG = { protocol: 'sftp', hostname: 'backup.local', port: 22 };

describe('tools/restoreControllerFromFileServer', () => {
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
            restoreControllerFromFileServer: vi.fn().mockResolvedValue(null),
        } as unknown as OmadaClient;
    });

    it('should register the restoreControllerFromFileServer tool', () => {
        registerRestoreControllerFromFileServerTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('restoreControllerFromFileServer', expect.any(Object), expect.any(Function));
    });

    it('should call restoreControllerFromFileServer with correct args', async () => {
        registerRestoreControllerFromFileServerTool(mockServer, mockClient);
        await toolHandler({ serverConfig: SERVER_CONFIG, filePath: '/backups/ctrl.bak', skipDevice: false }, { sessionId: 'test' });
        expect(mockClient.restoreControllerFromFileServer).toHaveBeenCalledWith(SERVER_CONFIG, '/backups/ctrl.bak', false, undefined);
    });

    it('should return dry-run summary without calling the controller', async () => {
        registerRestoreControllerFromFileServerTool(mockServer, mockClient);
        const result = (await toolHandler(
            { serverConfig: SERVER_CONFIG, filePath: '/backups/ctrl.bak', skipDevice: true, dryRun: true },
            { sessionId: 'test' }
        )) as { content: { text: string }[] };
        expect(mockClient.restoreControllerFromFileServer).not.toHaveBeenCalled();
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.action).toBe('restore-controller-file-server');
        expect(parsed.mode).toBe('dry-run');
    });
});
