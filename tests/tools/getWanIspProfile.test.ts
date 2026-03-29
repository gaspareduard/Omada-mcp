import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetWanIspProfileTool } from '../../src/tools/getWanIspProfile.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getWanIspProfile', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((_, __, h) => {
                toolHandler = h;
            }),
        } as unknown as McpServer;
        mockClient = { getWanIspProfile: vi.fn() } as unknown as OmadaClient;
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
        registerGetWanIspProfileTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('getWanIspProfile', expect.any(Object), expect.any(Function));
    });

    it('should execute with portUuid', async () => {
        const mockData = { ispName: 'TelecomX' };
        (mockClient.getWanIspProfile as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
        registerGetWanIspProfileTool(mockServer, mockClient);
        const result = await toolHandler({ portUuid: 'uuid-2' }, { sessionId: 'test' });
        expect(mockClient.getWanIspProfile).toHaveBeenCalledWith('uuid-2', undefined, undefined);
        expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
    });

    it('should pass siteId', async () => {
        (mockClient.getWanIspProfile as ReturnType<typeof vi.fn>).mockResolvedValue({});
        registerGetWanIspProfileTool(mockServer, mockClient);
        await toolHandler({ portUuid: 'uuid-2', siteId: 'site-1' }, { sessionId: 'test' });
        expect(mockClient.getWanIspProfile).toHaveBeenCalledWith('uuid-2', 'site-1', undefined);
    });

    it('should handle errors', async () => {
        (mockClient.getWanIspProfile as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
        registerGetWanIspProfileTool(mockServer, mockClient);
        await expect(toolHandler({ portUuid: 'uuid-2' }, { sessionId: 'test' })).rejects.toThrow('fail');
    });
});
