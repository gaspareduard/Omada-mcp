import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerBackupSitesToFileServerTool } from '../../src/tools/backupSitesToFileServer.js';

const SERVER_CONFIG = { protocol: 'sftp', hostname: 'backup.local', port: 22 };

describe('tools/backupSitesToFileServer', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<CallToolResult>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((_name, schema, handler) => {
                toolHandler = (args, extra) => handler(z.object(schema.inputSchema).parse(args), extra);
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
        await toolHandler({ dryRun: false, serverConfig: SERVER_CONFIG, filePath: '/backups/', siteIds: ['site-1'] }, { sessionId: 'test' });
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
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerBackupSitesToFileServerTool(mockServer, mockClient);
        const result = (await toolHandler({ serverConfig: SERVER_CONFIG, filePath: '/backups/', siteIds: ['site-1'] }, { sessionId: 'preview' })) as {
            content: { text: string }[];
            structuredContent: Record<string, unknown>;
        };
        const summary = JSON.parse(result.content[0].text);
        expect(summary).toMatchObject({ mode: 'dry-run', status: 'planned' });
        expect(result.structuredContent).toEqual(expect.objectContaining(summary));
        for (const [name, operation] of Object.entries(mockClient)) {
            if (!/^(get|list|resolve)/.test(name)) expect(operation).not.toHaveBeenCalled();
        }
    });
});
