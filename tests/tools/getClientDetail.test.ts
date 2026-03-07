import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetClientDetailTool } from '../../src/tools/getClientDetail.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getClientDetail', () => {
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
            getClientDetail: vi.fn(),
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

    describe('registerGetClientDetailTool', () => {
        it('should register the getClientDetail tool with correct schema', () => {
            registerGetClientDetailTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getClientDetail', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with clientMac', async () => {
            const mockData = { mac: 'AA-BB-CC-DD-EE-FF', ip: '192.168.1.100' };
            (mockClient.getClientDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetClientDetailTool(mockServer, mockClient);

            const result = await toolHandler({ clientMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getClientDetail).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { mac: 'AA-BB-CC-DD-EE-FF' };
            (mockClient.getClientDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetClientDetailTool(mockServer, mockClient);

            await toolHandler({ clientMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getClientDetail).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
        });

        it('should handle client not found returning undefined', async () => {
            (mockClient.getClientDetail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetClientDetailTool(mockServer, mockClient);

            const result = await toolHandler({ clientMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getClientDetail as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetClientDetailTool(mockServer, mockClient);

            await expect(toolHandler({ clientMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getClientDetail',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
