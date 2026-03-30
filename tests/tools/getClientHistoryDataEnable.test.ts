import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetClientHistoryDataEnableTool } from '../../src/tools/getClientHistoryDataEnable.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getClientHistoryDataEnable', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getClientHistoryDataEnable: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetClientHistoryDataEnableTool', () => {
        it('should register the tool', () => {
            registerGetClientHistoryDataEnableTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getClientHistoryDataEnable', expect.any(Object), expect.any(Function));
        });

        it('should call getClientHistoryDataEnable', async () => {
            const mockData = { id: 'history-1' };
            (mockClient.getClientHistoryDataEnable as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetClientHistoryDataEnableTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getClientHistoryDataEnable).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getClientHistoryDataEnable as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetClientHistoryDataEnableTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
