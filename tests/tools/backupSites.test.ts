import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerBackupSitesTool } from '../../src/tools/backupSites.js';

describe('tools/backupSites', () => {
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
            backupSites: vi.fn().mockResolvedValue(null),
        } as unknown as OmadaClient;
    });

    it('should register the backupSites tool', () => {
        registerBackupSitesTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('backupSites', expect.any(Object), expect.any(Function));
    });

    it('should call backupSites with siteIds', async () => {
        registerBackupSitesTool(mockServer, mockClient);
        await toolHandler({ siteIds: ['site-1', 'site-2'] }, { sessionId: 'test' });
        expect(mockClient.backupSites).toHaveBeenCalledWith(['site-1', 'site-2'], undefined);
    });

    it('should return dry-run summary without calling the controller', async () => {
        registerBackupSitesTool(mockServer, mockClient);
        const result = (await toolHandler({ siteIds: ['site-1'], dryRun: true }, { sessionId: 'test' })) as { content: { text: string }[] };
        expect(mockClient.backupSites).not.toHaveBeenCalled();
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.action).toBe('backup-sites');
        expect(parsed.mode).toBe('dry-run');
        expect(parsed.status).toBe('planned');
    });

    it('should return applied summary when executed', async () => {
        registerBackupSitesTool(mockServer, mockClient);
        const result = (await toolHandler({ siteIds: ['site-1', 'site-2'] }, { sessionId: 'test' })) as { content: { text: string }[] };
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.action).toBe('backup-sites');
        expect(parsed.mode).toBe('apply');
    });
});
