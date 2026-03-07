import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetPPSKProfilesTool } from '../../src/tools/getPPSKProfiles.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getPPSKProfiles', () => {
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

    describe('registerGetPPSKProfilesTool', () => {
        it('should register the getPPSKProfiles tool with correct schema', () => {
            registerGetPPSKProfilesTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getPPSKProfiles', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with type 0', async () => {
            const mockData = [{ profileId: 'ppsk-1', type: 0 }];
            (mockClient.getPPSKProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetPPSKProfilesTool(mockServer, mockClient);
            const result = await toolHandler({ type: 0 }, { sessionId: 'test-session' });
            expect(mockClient.getPPSKProfiles).toHaveBeenCalledWith(0, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with type 1 and siteId', async () => {
            const mockData = [{ profileId: 'ppsk-2', type: 1 }];
            (mockClient.getPPSKProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetPPSKProfilesTool(mockServer, mockClient);
            await toolHandler({ type: 1, siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getPPSKProfiles).toHaveBeenCalledWith(1, 'test-site', undefined);
        });

        it('should execute successfully with type 2', async () => {
            const mockData = [{ profileId: 'ppsk-3', type: 2 }];
            (mockClient.getPPSKProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetPPSKProfilesTool(mockServer, mockClient);
            await toolHandler({ type: 2 }, { sessionId: 'test-session' });
            expect(mockClient.getPPSKProfiles).toHaveBeenCalledWith(2, undefined, undefined);
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getPPSKProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetPPSKProfilesTool(mockServer, mockClient);
            const result = await toolHandler({ type: 0 }, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getPPSKProfiles as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetPPSKProfilesTool(mockServer, mockClient);
            await expect(toolHandler({ type: 0 }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getPPSKProfiles',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
