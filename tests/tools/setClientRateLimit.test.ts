import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetClientRateLimitTool } from '../../src/tools/setClientRateLimit.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/setClientRateLimit', () => {
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
            setClientRateLimit: vi.fn(),
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

    describe('registerSetClientRateLimitTool', () => {
        it('should register the setClientRateLimit tool with correct schema', () => {
            registerSetClientRateLimitTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('setClientRateLimit', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with required args', async () => {
            const mockData = { success: true };
            (mockClient.setClientRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerSetClientRateLimitTool(mockServer, mockClient);

            const result = await toolHandler({ clientMac: 'AA:BB:CC:DD:EE:FF', downLimit: 10240, upLimit: 5120 }, { sessionId: 'test-session' });

            expect(mockClient.setClientRateLimit).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 10240, 5120, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { success: true };
            (mockClient.setClientRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerSetClientRateLimitTool(mockServer, mockClient);

            await toolHandler(
                { clientMac: 'AA:BB:CC:DD:EE:FF', downLimit: 10240, upLimit: 5120, siteId: 'test-site' },
                { sessionId: 'test-session' }
            );

            expect(mockClient.setClientRateLimit).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 10240, 5120, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.setClientRateLimit as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerSetClientRateLimitTool(mockServer, mockClient);

            await expect(
                toolHandler({ clientMac: 'AA:BB:CC:DD:EE:FF', downLimit: 10240, upLimit: 5120 }, { sessionId: 'test-session' })
            ).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'setClientRateLimit',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
