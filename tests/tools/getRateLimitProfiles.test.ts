import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRateLimitProfilesTool } from '../../src/tools/getRateLimitProfiles.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRateLimitProfiles', () => {
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

    describe('registerGetRateLimitProfilesTool', () => {
        it('should register the getRateLimitProfiles tool with correct schema', () => {
            registerGetRateLimitProfilesTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRateLimitProfiles', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = [{ profileId: 'rl-1', downloadLimit: 100, uploadLimit: 50 }];
            (mockClient.getRateLimitProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRateLimitProfilesTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getRateLimitProfiles).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ profileId: 'rl-2' }];
            (mockClient.getRateLimitProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRateLimitProfilesTool(mockServer, mockClient);
            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getRateLimitProfiles).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getRateLimitProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetRateLimitProfilesTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getRateLimitProfiles as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetRateLimitProfilesTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getRateLimitProfiles',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
