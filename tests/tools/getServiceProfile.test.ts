import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetServiceProfileTool } from '../../src/tools/getServiceProfile.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getServiceProfile', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;

        mockClient = {
            listServiceType: vi.fn(),
        } as unknown as OmadaClient;

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

    describe('registerGetServiceProfileTool', () => {
        it('should register the tool', () => {
            registerGetServiceProfileTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getServiceProfile', expect.any(Object), expect.any(Function));
        });

        it('should delegate to listServiceType with pagination', async () => {
            const mockData = { data: [], totalRows: 0 };
            (mockClient.listServiceType as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetServiceProfileTool(mockServer, mockClient);
            const result = await toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' });
            expect(mockClient.listServiceType).toHaveBeenCalledWith(1, 10, undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.listServiceType as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetServiceProfileTool(mockServer, mockClient);
            await toolHandler({ page: 2, pageSize: 20, siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.listServiceType).toHaveBeenCalledWith(2, 20, 'site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.listServiceType as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetServiceProfileTool(mockServer, mockClient);
            await expect(toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
