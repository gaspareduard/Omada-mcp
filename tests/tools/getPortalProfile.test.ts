import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetPortalProfileTool } from '../../src/tools/getPortalProfile.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getPortalProfile', () => {
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
            getPortalProfile: vi.fn(),
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

    describe('registerGetPortalProfileTool', () => {
        it('should register the tool', () => {
            registerGetPortalProfileTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getPortalProfile', expect.any(Object), expect.any(Function));
        });

        it('should call getPortalProfile', async () => {
            const mockData = [{ id: 'portal-1', name: 'Guest Portal' }];
            (mockClient.getPortalProfile as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetPortalProfileTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getPortalProfile).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getPortalProfile as ReturnType<typeof vi.fn>).mockResolvedValue([]);
            registerGetPortalProfileTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getPortalProfile).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getPortalProfile as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetPortalProfileTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
