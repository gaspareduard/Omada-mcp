import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetQosProfileTool } from '../../src/tools/getQosProfile.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getQosProfile', () => {
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
            getRateLimitProfiles: vi.fn(),
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

    describe('registerGetQosProfileTool', () => {
        it('should register the tool', () => {
            registerGetQosProfileTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getQosProfile', expect.any(Object), expect.any(Function));
        });

        it('should delegate to getRateLimitProfiles', async () => {
            const mockData = [{ id: 'profile-1' }];
            (mockClient.getRateLimitProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetQosProfileTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getRateLimitProfiles).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getRateLimitProfiles as ReturnType<typeof vi.fn>).mockResolvedValue([]);
            registerGetQosProfileTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getRateLimitProfiles).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getRateLimitProfiles as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetQosProfileTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
