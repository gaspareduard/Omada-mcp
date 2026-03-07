import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetDnsProxyTool } from '../../src/tools/getDnsProxy.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getDnsProxy', () => {
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
            getDnsProxy: vi.fn(),
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

    describe('registerGetDnsProxyTool', () => {
        it('should register the getDnsProxy tool with correct schema', () => {
            registerGetDnsProxyTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDnsProxy', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { enabled: true, primaryDns: '8.8.8.8', secondaryDns: '8.8.4.4' };
            (mockClient.getDnsProxy as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDnsProxyTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getDnsProxy).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { enabled: true };
            (mockClient.getDnsProxy as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDnsProxyTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getDnsProxy).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getDnsProxy as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetDnsProxyTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getDnsProxy',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
