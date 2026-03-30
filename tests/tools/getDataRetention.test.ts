import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetDataRetentionTool } from '../../src/tools/getDataRetention.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getDataRetention', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getDataRetention: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetDataRetentionTool', () => {
        it('should register the tool', () => {
            registerGetDataRetentionTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDataRetention', expect.any(Object), expect.any(Function));
        });

        it('should call getDataRetention', async () => {
            const mockData = { id: 'retention-1' };
            (mockClient.getDataRetention as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetDataRetentionTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getDataRetention).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getDataRetention as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetDataRetentionTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
