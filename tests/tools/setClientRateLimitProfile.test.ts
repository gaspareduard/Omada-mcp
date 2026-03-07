import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetClientRateLimitProfileTool } from '../../src/tools/setClientRateLimitProfile.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/setClientRateLimitProfile', () => {
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
            setClientRateLimitProfile: vi.fn(),
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

    describe('registerSetClientRateLimitProfileTool', () => {
        it('should register the setClientRateLimitProfile tool with correct schema', () => {
            registerSetClientRateLimitProfileTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('setClientRateLimitProfile', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with required args', async () => {
            const mockData = { success: true };
            (mockClient.setClientRateLimitProfile as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerSetClientRateLimitProfileTool(mockServer, mockClient);

            const result = await toolHandler({ clientMac: 'AA:BB:CC:DD:EE:FF', profileId: 'profile-123' }, { sessionId: 'test-session' });

            expect(mockClient.setClientRateLimitProfile).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 'profile-123', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { success: true };
            (mockClient.setClientRateLimitProfile as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerSetClientRateLimitProfileTool(mockServer, mockClient);

            await toolHandler({ clientMac: 'AA:BB:CC:DD:EE:FF', profileId: 'profile-123', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.setClientRateLimitProfile).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 'profile-123', 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.setClientRateLimitProfile as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerSetClientRateLimitProfileTool(mockServer, mockClient);

            await expect(toolHandler({ clientMac: 'AA:BB:CC:DD:EE:FF', profileId: 'profile-123' }, { sessionId: 'test-session' })).rejects.toThrow(
                'API error'
            );

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'setClientRateLimitProfile',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
