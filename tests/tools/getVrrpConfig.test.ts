import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetVrrpConfigTool } from '../../src/tools/getVrrpConfig.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getVrrpConfig', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((_, __, h) => {
                toolHandler = h;
            }),
        } as unknown as McpServer;
        mockClient = { getVrrpConfig: vi.fn() } as unknown as OmadaClient;
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
        registerGetVrrpConfigTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('getVrrpConfig', expect.any(Object), expect.any(Function));
    });

    it('should execute with no args', async () => {
        const mockData = { result: true };
        (mockClient.getVrrpConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
        registerGetVrrpConfigTool(mockServer, mockClient);
        const result = await toolHandler({}, { sessionId: 'test' });
        expect(mockClient.getVrrpConfig).toHaveBeenCalledWith(undefined, undefined);
        expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
    });

    it('should pass siteId', async () => {
        (mockClient.getVrrpConfig as ReturnType<typeof vi.fn>).mockResolvedValue({});
        registerGetVrrpConfigTool(mockServer, mockClient);
        await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
        expect(mockClient.getVrrpConfig).toHaveBeenCalledWith('site-1', undefined);
    });

    it('should handle errors', async () => {
        (mockClient.getVrrpConfig as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
        registerGetVrrpConfigTool(mockServer, mockClient);
        await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
    });
});
