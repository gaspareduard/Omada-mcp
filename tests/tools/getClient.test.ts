import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetClientTool } from '../../src/tools/getClient.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getClient', () => {
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
            getClient: vi.fn(),
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

    describe('registerGetClientTool', () => {
        it('should register the getClient tool with correct schema', () => {
            registerGetClientTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getClient', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with clientId', async () => {
            const mockData = { mac: 'AA-BB-CC-DD-EE-FF', name: 'Test Client' };
            (mockClient.getClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetClientTool(mockServer, mockClient);

            const result = await toolHandler({ clientId: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getClient).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { mac: 'AA-BB-CC-DD-EE-FF' };
            (mockClient.getClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetClientTool(mockServer, mockClient);

            await toolHandler({ clientId: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getClient).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
        });

        it('should handle client not found returning undefined', async () => {
            (mockClient.getClient as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetClientTool(mockServer, mockClient);

            const result = await toolHandler({ clientId: 'nonexistent' }, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getClient as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetClientTool(mockServer, mockClient);

            await expect(toolHandler({ clientId: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getClient',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
