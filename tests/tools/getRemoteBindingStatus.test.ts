import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRemoteBindingStatusTool } from '../../src/tools/getRemoteBindingStatus.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRemoteBindingStatus', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getRemoteBindingStatus: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetRemoteBindingStatusTool', () => {
        it('should register the tool', () => {
            registerGetRemoteBindingStatusTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRemoteBindingStatus', expect.any(Object), expect.any(Function));
        });

        it('should call getRemoteBindingStatus', async () => {
            const mockData = { id: 'bind-1' };
            (mockClient.getRemoteBindingStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRemoteBindingStatusTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getRemoteBindingStatus).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getRemoteBindingStatus as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetRemoteBindingStatusTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
