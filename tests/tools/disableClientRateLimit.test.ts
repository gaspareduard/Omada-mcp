import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDisableClientRateLimitTool } from '../../src/tools/disableClientRateLimit.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/disableClientRateLimit', () => {
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
            disableClientRateLimit: vi.fn(),
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

    describe('registerDisableClientRateLimitTool', () => {
        it('should register the disableClientRateLimit tool with correct schema', () => {
            registerDisableClientRateLimitTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('disableClientRateLimit', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with clientMac', async () => {
            const mockData = { result: 'success' };
            (mockClient.disableClientRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerDisableClientRateLimitTool(mockServer, mockClient);

            const result = await toolHandler({ clientMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.disableClientRateLimit).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { result: 'success' };
            (mockClient.disableClientRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerDisableClientRateLimitTool(mockServer, mockClient);

            await toolHandler({ clientMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.disableClientRateLimit).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
        });

        it('should handle empty response', async () => {
            (mockClient.disableClientRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerDisableClientRateLimitTool(mockServer, mockClient);

            const result = await toolHandler({ clientMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.disableClientRateLimit as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerDisableClientRateLimitTool(mockServer, mockClient);

            await expect(toolHandler({ clientMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'disableClientRateLimit',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
