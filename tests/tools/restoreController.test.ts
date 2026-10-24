import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerRestoreControllerTool } from '../../src/tools/restoreController.js';

describe('tools/restoreController', () => {
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
            restoreController: vi.fn().mockResolvedValue(null),
        } as unknown as OmadaClient;
    });

    it('should register the restoreController tool', () => {
        registerRestoreControllerTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('restoreController', expect.any(Object), expect.any(Function));
    });

    it('should return confirmation-required when confirmDangerous is not set', async () => {
        registerRestoreControllerTool(mockServer, mockClient);
        const result = (await toolHandler({ dryRun: false, fileName: 'backup-2024.cfg' }, { sessionId: 'test' })) as { content: { text: string }[] };
        expect(mockClient.restoreController).not.toHaveBeenCalled();
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.confirmationRequired).toBe(true);
        expect(parsed.tool).toBe('restoreController');
        expect(parsed.warning).toContain('IRREVERSIBLE');
        expect(parsed.warning).toContain('confirmDangerous: true');
    });

    it('should return confirmation-required when confirmDangerous is false', async () => {
        registerRestoreControllerTool(mockServer, mockClient);
        const result = (await toolHandler({ dryRun: false, fileName: 'backup-2024.cfg', confirmDangerous: false }, { sessionId: 'test' })) as {
            content: { text: string }[];
        };
        expect(mockClient.restoreController).not.toHaveBeenCalled();
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.confirmationRequired).toBe(true);
    });

    it('should call restoreController when confirmDangerous is true', async () => {
        registerRestoreControllerTool(mockServer, mockClient);
        await toolHandler({ dryRun: false, fileName: 'backup-2024.cfg', confirmDangerous: true }, { sessionId: 'test' });
        expect(mockClient.restoreController).toHaveBeenCalledWith('backup-2024.cfg', undefined);
    });

    it('should return dry-run summary without calling the controller', async () => {
        registerRestoreControllerTool(mockServer, mockClient);
        const result = (await toolHandler({ fileName: 'backup-2024.cfg', dryRun: true }, { sessionId: 'test' })) as {
            content: { text: string }[];
        };
        expect(mockClient.restoreController).not.toHaveBeenCalled();
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.action).toBe('restore-controller');
        expect(parsed.mode).toBe('dry-run');
        expect(parsed.status).toBe('planned');
    });

    it('should return submitted summary when confirmed and executed', async () => {
        registerRestoreControllerTool(mockServer, mockClient);
        const result = (await toolHandler({ dryRun: false, fileName: 'backup-2024.cfg', confirmDangerous: true }, { sessionId: 'test' })) as {
            content: { text: string }[];
        };
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.action).toBe('restore-controller');
        expect(parsed.mode).toBe('apply');
        expect(parsed.status).toBe('submitted');
        expect(parsed.target).toBe('backup-2024.cfg');
    });
    it.each([undefined, true])('defaults omitted dryRun to preview even with confirmDangerous=%s', async (confirmDangerous) => {
        registerRestoreControllerTool(mockServer, mockClient);
        const result = (await toolHandler({ confirmDangerous, fileName: 'backup-2024.cfg' }, { sessionId: 'preview' })) as {
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
