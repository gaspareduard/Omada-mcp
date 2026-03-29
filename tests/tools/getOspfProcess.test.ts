import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetOspfProcessTool } from '../../src/tools/getOspfProcess.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getOspfProcess', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((_, __, h) => {
                toolHandler = h;
            }),
        } as unknown as McpServer;
        mockClient = { getOspfProcess: vi.fn() } as unknown as OmadaClient;
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
        registerGetOspfProcessTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('getOspfProcess', expect.any(Object), expect.any(Function));
    });

    it('should execute with no args', async () => {
        const mockData = { result: true };
        (mockClient.getOspfProcess as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
        registerGetOspfProcessTool(mockServer, mockClient);
        const result = await toolHandler({}, { sessionId: 'test' });
        expect(mockClient.getOspfProcess).toHaveBeenCalledWith(undefined, undefined);
        expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
    });

    it('should pass siteId', async () => {
        (mockClient.getOspfProcess as ReturnType<typeof vi.fn>).mockResolvedValue({});
        registerGetOspfProcessTool(mockServer, mockClient);
        await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
        expect(mockClient.getOspfProcess).toHaveBeenCalledWith('site-1', undefined);
    });

    it('should handle errors', async () => {
        (mockClient.getOspfProcess as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
        registerGetOspfProcessTool(mockServer, mockClient);
        await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
    });
});
