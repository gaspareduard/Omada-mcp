import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetWanNatConfigTool } from '../../src/tools/getWanNatConfig.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getWanNatConfig', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((_, __, h) => {
                toolHandler = h;
            }),
        } as unknown as McpServer;
        mockClient = { getWanNatConfig: vi.fn() } as unknown as OmadaClient;
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

    it('should register the tool', () => {
        registerGetWanNatConfigTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('getWanNatConfig', expect.any(Object), expect.any(Function));
    });

    it('should execute with defaults', async () => {
        const mockData = { totalRows: 2, data: [] };
        (mockClient.getWanNatConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
        registerGetWanNatConfigTool(mockServer, mockClient);
        const result = await toolHandler({}, { sessionId: 'test' });
        expect(mockClient.getWanNatConfig).toHaveBeenCalledWith(1, 10, undefined, undefined);
        expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
    });

    it('should pass pagination and siteId', async () => {
        (mockClient.getWanNatConfig as ReturnType<typeof vi.fn>).mockResolvedValue({});
        registerGetWanNatConfigTool(mockServer, mockClient);
        await toolHandler({ page: 2, pageSize: 5, siteId: 'site-1' }, { sessionId: 'test' });
        expect(mockClient.getWanNatConfig).toHaveBeenCalledWith(2, 5, 'site-1', undefined);
    });

    it('should handle errors', async () => {
        (mockClient.getWanNatConfig as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
        registerGetWanNatConfigTool(mockServer, mockClient);
        await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
    });
});
