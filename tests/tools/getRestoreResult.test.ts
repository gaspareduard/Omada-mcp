import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRestoreResultTool } from '../../src/tools/getRestoreResult.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRestoreResult', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getRestoreResult: vi.fn() } as unknown as OmadaClient;
        vi.spyOn(loggerModule.logger, 'info').mockImplementation(() => {
            // Mock implementation
        });
        vi.spyOn(loggerModule.logger, 'error').mockImplementation(() => {
            // Mock implementation
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('registerGetRestoreResultTool', () => {
        it('should register the tool', () => {
            registerGetRestoreResultTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRestoreResult', expect.any(Object), expect.any(Function));
        });

        it('should call getRestoreResult', async () => {
            const mockData = { id: 'restore-1' };
            (mockClient.getRestoreResult as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRestoreResultTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getRestoreResult).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getRestoreResult as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetRestoreResultTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
