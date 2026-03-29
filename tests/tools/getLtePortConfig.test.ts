import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetLtePortConfigTool } from '../../src/tools/getLtePortConfig.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getLtePortConfig', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((_, __, h) => {
                toolHandler = h;
            }),
        } as unknown as McpServer;
        mockClient = { getLtePortConfig: vi.fn() } as unknown as OmadaClient;
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
        registerGetLtePortConfigTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('getLtePortConfig', expect.any(Object), expect.any(Function));
    });

    it('should execute with no args', async () => {
        const mockData = { lteConfig: true };
        (mockClient.getLtePortConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
        registerGetLtePortConfigTool(mockServer, mockClient);
        const result = await toolHandler({}, { sessionId: 'test' });
        expect(mockClient.getLtePortConfig).toHaveBeenCalledWith(undefined, undefined);
        expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
    });

    it('should pass siteId', async () => {
        (mockClient.getLtePortConfig as ReturnType<typeof vi.fn>).mockResolvedValue({});
        registerGetLtePortConfigTool(mockServer, mockClient);
        await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
        expect(mockClient.getLtePortConfig).toHaveBeenCalledWith('site-1', undefined);
    });

    it('should handle errors', async () => {
        (mockClient.getLtePortConfig as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
        registerGetLtePortConfigTool(mockServer, mockClient);
        await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
    });
});
