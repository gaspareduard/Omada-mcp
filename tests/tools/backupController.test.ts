import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerBackupControllerTool } from '../../src/tools/backupController.js';

describe('tools/backupController', () => {
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
            backupController: vi.fn().mockResolvedValue(null),
        } as unknown as OmadaClient;
    });

    it('should register the backupController tool', () => {
        registerBackupControllerTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('backupController', expect.any(Object), expect.any(Function));
    });

    it('should call backupController when not in dry-run mode', async () => {
        registerBackupControllerTool(mockServer, mockClient);
        await toolHandler({ retainUser: true }, { sessionId: 'test' });
        expect(mockClient.backupController).toHaveBeenCalledWith(true, undefined);
    });

    it('should return dry-run summary without calling the controller', async () => {
        registerBackupControllerTool(mockServer, mockClient);
        const result = (await toolHandler({ retainUser: false, dryRun: true }, { sessionId: 'test' })) as { content: { text: string }[] };
        expect(mockClient.backupController).not.toHaveBeenCalled();
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.action).toBe('backup-controller');
        expect(parsed.mode).toBe('dry-run');
        expect(parsed.status).toBe('planned');
    });

    it('should return applied summary when executed', async () => {
        registerBackupControllerTool(mockServer, mockClient);
        const result = (await toolHandler({ retainUser: true }, { sessionId: 'test' })) as { content: { text: string }[] };
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.action).toBe('backup-controller');
        expect(parsed.mode).toBe('apply');
        expect(parsed.status).toBe('applied');
    });
});
