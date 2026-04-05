import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerRestoreSitesTool } from '../../src/tools/restoreSites.js';

describe('tools/restoreSites', () => {
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
            restoreSites: vi.fn().mockResolvedValue(null),
        } as unknown as OmadaClient;
    });

    it('should register the restoreSites tool', () => {
        registerRestoreSitesTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('restoreSites', expect.any(Object), expect.any(Function));
    });

    it('should return confirmation-required when confirmDangerous is not set', async () => {
        const infos = [{ fileName: 'site1.bak', siteId: 'site-1' }];
        registerRestoreSitesTool(mockServer, mockClient);
        const result = (await toolHandler({ siteRestoreInfos: infos }, { sessionId: 'test' })) as { content: { text: string }[] };
        expect(mockClient.restoreSites).not.toHaveBeenCalled();
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.confirmationRequired).toBe(true);
        expect(parsed.tool).toBe('restoreSites');
        expect(parsed.siteCount).toBe(1);
        expect(parsed.warning).toContain('IRREVERSIBLE');
        expect(parsed.warning).toContain('confirmDangerous: true');
    });

    it('should call restoreSites when confirmDangerous is true', async () => {
        const infos = [{ fileName: 'site1.bak', siteId: 'site-1' }];
        registerRestoreSitesTool(mockServer, mockClient);
        await toolHandler({ siteRestoreInfos: infos, confirmDangerous: true }, { sessionId: 'test' });
        expect(mockClient.restoreSites).toHaveBeenCalledWith(infos, undefined);
    });

    it('should return dry-run summary without calling the controller', async () => {
        const infos = [{ fileName: 'site1.bak', siteId: 'site-1' }];
        registerRestoreSitesTool(mockServer, mockClient);
        const result = (await toolHandler({ siteRestoreInfos: infos, dryRun: true }, { sessionId: 'test' })) as { content: { text: string }[] };
        expect(mockClient.restoreSites).not.toHaveBeenCalled();
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.action).toBe('restore-sites');
        expect(parsed.mode).toBe('dry-run');
        expect(parsed.status).toBe('planned');
    });

    it('should include siteId in target when confirmed and applied', async () => {
        const infos = [
            { fileName: 'site1.bak', siteId: 'site-1' },
            { fileName: 'site2.bak', siteId: 'site-2' },
        ];
        registerRestoreSitesTool(mockServer, mockClient);
        const result = (await toolHandler({ siteRestoreInfos: infos, confirmDangerous: true }, { sessionId: 'test' })) as {
            content: { text: string }[];
        };
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.target).toContain('site-1');
        expect(parsed.target).toContain('site-2');
    });
});
