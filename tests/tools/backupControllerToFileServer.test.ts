import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerBackupControllerToFileServerTool } from '../../src/tools/backupControllerToFileServer.js';

const SERVER_CONFIG = { protocol: 'sftp', hostname: 'backup.local', port: 22 };

describe('tools/backupControllerToFileServer', () => {
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
            backupControllerToFileServer: vi.fn().mockResolvedValue(null),
        } as unknown as OmadaClient;
    });

    it('should register the backupControllerToFileServer tool', () => {
        registerBackupControllerToFileServerTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('backupControllerToFileServer', expect.any(Object), expect.any(Function));
    });

    it('should call backupControllerToFileServer with correct args', async () => {
        registerBackupControllerToFileServerTool(mockServer, mockClient);
        await toolHandler({ dryRun: false, serverConfig: SERVER_CONFIG, filePath: '/backups/ctrl.bak', retainUser: true }, { sessionId: 'test' });
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
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerBackupControllerToFileServerTool(mockServer, mockClient);
        const result = (await toolHandler(
            { serverConfig: SERVER_CONFIG, filePath: '/backups/ctrl.bak', retainUser: true },
            { sessionId: 'preview' }
        )) as { content: { text: string }[]; structuredContent: Record<string, unknown> };
        const summary = JSON.parse(result.content[0].text);
        expect(summary).toMatchObject({ mode: 'dry-run', status: 'planned' });
        expect(result.structuredContent).toEqual(expect.objectContaining(summary));
        for (const [name, operation] of Object.entries(mockClient)) {
            if (!/^(get|list|resolve)/.test(name)) expect(operation).not.toHaveBeenCalled();
        }
    });
});
