import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetPpskNetworkProfileTool } from '../../src/tools/getPpskNetworkProfile.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getPpskNetworkProfile', () => {
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
            getPPSKProfiles: vi.fn(),
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

    describe('registerGetPpskNetworkProfileTool', () => {
        it('should register the tool', () => {
            registerGetPpskNetworkProfileTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getPpskNetworkProfile', expect.any(Object), expect.any(Function));
        });

        it('should call getPPSKProfiles with type param', async () => {
            const mockData = [{ id: 'profile-1' }];
            (mockClient.getPPSKProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetPpskNetworkProfileTool(mockServer, mockClient);
            const result = await toolHandler({ type: 0 }, { sessionId: 'test' });
            expect(mockClient.getPPSKProfiles).toHaveBeenCalledWith(0, undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getPPSKProfiles as ReturnType<typeof vi.fn>).mockResolvedValue([]);
            registerGetPpskNetworkProfileTool(mockServer, mockClient);
            await toolHandler({ type: 1, siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getPPSKProfiles).toHaveBeenCalledWith(1, 'site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getPPSKProfiles as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetPpskNetworkProfileTool(mockServer, mockClient);
            await expect(toolHandler({ type: 0 }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
