import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerRestoreSitesFromFileServerTool } from '../../src/tools/restoreSitesFromFileServer.js';

const SERVER_CONFIG = { protocol: 'sftp', hostname: 'backup.local', port: 22 };

describe('tools/restoreSitesFromFileServer', () => {
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
            restoreSitesFromFileServer: vi.fn().mockResolvedValue(null),
        } as unknown as OmadaClient;
    });

    it('should register the restoreSitesFromFileServer tool', () => {
        registerRestoreSitesFromFileServerTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('restoreSitesFromFileServer', expect.any(Object), expect.any(Function));
    });

    it('should return confirmation-required when confirmDangerous is not set', async () => {
        const infos = [{ filePath: '/backups/site1.bak', siteId: 'site-1' }];
        registerRestoreSitesFromFileServerTool(mockServer, mockClient);
        const result = (await toolHandler({ serverConfig: SERVER_CONFIG, siteInfos: infos }, { sessionId: 'test' })) as {
            content: { text: string }[];
        };
        expect(mockClient.restoreSitesFromFileServer).not.toHaveBeenCalled();
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.confirmationRequired).toBe(true);
        expect(parsed.tool).toBe('restoreSitesFromFileServer');
        expect(parsed.siteCount).toBe(1);
        expect(parsed.warning).toContain('IRREVERSIBLE');
        expect(parsed.warning).toContain('confirmDangerous: true');
    });

    it('should call restoreSitesFromFileServer when confirmDangerous is true', async () => {
        const infos = [{ filePath: '/backups/site1.bak', siteId: 'site-1' }];
        registerRestoreSitesFromFileServerTool(mockServer, mockClient);
        await toolHandler({ serverConfig: SERVER_CONFIG, siteInfos: infos, confirmDangerous: true }, { sessionId: 'test' });
        expect(mockClient.restoreSitesFromFileServer).toHaveBeenCalledWith(SERVER_CONFIG, infos, undefined);
    });

    it('should return dry-run summary without calling the controller', async () => {
        const infos = [{ filePath: '/backups/site1.bak', siteId: 'site-1' }];
        registerRestoreSitesFromFileServerTool(mockServer, mockClient);
        const result = (await toolHandler({ serverConfig: SERVER_CONFIG, siteInfos: infos, dryRun: true }, { sessionId: 'test' })) as {
            content: { text: string }[];
        };
        expect(mockClient.restoreSitesFromFileServer).not.toHaveBeenCalled();
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.action).toBe('restore-sites-file-server');
        expect(parsed.mode).toBe('dry-run');
        expect(parsed.status).toBe('planned');
    });

    it('should include siteId in target when confirmed and applied', async () => {
        const infos = [{ filePath: '/backups/site1.bak', siteId: 'site-1' }];
        registerRestoreSitesFromFileServerTool(mockServer, mockClient);
        const result = (await toolHandler({ serverConfig: SERVER_CONFIG, siteInfos: infos, confirmDangerous: true }, { sessionId: 'test' })) as {
            content: { text: string }[];
        };
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.target).toContain('site-1');
    });
});
