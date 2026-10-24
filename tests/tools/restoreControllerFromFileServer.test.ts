import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerRestoreControllerFromFileServerTool } from '../../src/tools/restoreControllerFromFileServer.js';

const SERVER_CONFIG = { protocol: 'sftp', hostname: 'backup.local', port: 22 };

describe('tools/restoreControllerFromFileServer', () => {
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
            restoreControllerFromFileServer: vi.fn().mockResolvedValue(null),
        } as unknown as OmadaClient;
    });

    it('should register the restoreControllerFromFileServer tool', () => {
        registerRestoreControllerFromFileServerTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('restoreControllerFromFileServer', expect.any(Object), expect.any(Function));
    });

    it('should return confirmation-required when confirmDangerous is not set', async () => {
        registerRestoreControllerFromFileServerTool(mockServer, mockClient);
        const result = (await toolHandler(
            { dryRun: false, serverConfig: SERVER_CONFIG, filePath: '/backups/ctrl.bak', skipDevice: false },
            { sessionId: 'test' }
        )) as { content: { text: string }[] };
        expect(mockClient.restoreControllerFromFileServer).not.toHaveBeenCalled();
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.confirmationRequired).toBe(true);
        expect(parsed.tool).toBe('restoreControllerFromFileServer');
        expect(parsed.warning).toContain('IRREVERSIBLE');
        expect(parsed.warning).toContain('confirmDangerous: true');
    });

    it('should call restoreControllerFromFileServer when confirmDangerous is true', async () => {
        registerRestoreControllerFromFileServerTool(mockServer, mockClient);
        await toolHandler(
            { dryRun: false, serverConfig: SERVER_CONFIG, filePath: '/backups/ctrl.bak', skipDevice: false, confirmDangerous: true },
            { sessionId: 'test' }
        );
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

    it('should return submitted summary when confirmed and executed', async () => {
        registerRestoreControllerFromFileServerTool(mockServer, mockClient);
        const result = (await toolHandler(
            { dryRun: false, serverConfig: SERVER_CONFIG, filePath: '/backups/ctrl.bak', skipDevice: false, confirmDangerous: true },
            { sessionId: 'test' }
        )) as { content: { text: string }[] };
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.action).toBe('restore-controller-file-server');
        expect(parsed.mode).toBe('apply');
        expect(parsed.status).toBe('submitted');
    });
    it.each([undefined, true])('defaults omitted dryRun to preview even with confirmDangerous=%s', async (confirmDangerous) => {
        registerRestoreControllerFromFileServerTool(mockServer, mockClient);
        const result = (await toolHandler(
            { confirmDangerous, serverConfig: SERVER_CONFIG, filePath: '/backups/ctrl.bak', skipDevice: false },
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
