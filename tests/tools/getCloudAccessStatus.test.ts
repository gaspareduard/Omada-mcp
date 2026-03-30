import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetCloudAccessStatusTool } from '../../src/tools/getCloudAccessStatus.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getCloudAccessStatus', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getCloudAccessStatus: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetCloudAccessStatusTool', () => {
        it('should register the tool', () => {
            registerGetCloudAccessStatusTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getCloudAccessStatus', expect.any(Object), expect.any(Function));
        });

        it('should call getCloudAccessStatus', async () => {
            const mockData = { id: 'cloud-1' };
            (mockClient.getCloudAccessStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetCloudAccessStatusTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getCloudAccessStatus).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getCloudAccessStatus as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetCloudAccessStatusTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
