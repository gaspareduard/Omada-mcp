import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridIpsecFailoverTool } from '../../src/tools/getGridIpsecFailover.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridIpsecFailover', () => {
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
            getGridIpsecFailover: vi.fn(),
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

    describe('registerGetGridIpsecFailoverTool', () => {
        it('should register the getGridIpsecFailover tool with correct schema', () => {
            registerGetGridIpsecFailoverTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridIpsecFailover', expect.any(Object), expect.any(Function));
        });

        it('should successfully get IPsec failover config with defaults', async () => {
            const mockData = { data: [{ id: '1', primaryTunnel: 'tunnel-1', backupTunnel: 'tunnel-2' }], totalRows: 1 };

            (mockClient.getGridIpsecFailover as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridIpsecFailoverTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getGridIpsecFailover).toHaveBeenCalledWith(1, 10, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination params when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridIpsecFailover as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridIpsecFailoverTool(mockServer, mockClient);

            await toolHandler({ page: 2, pageSize: 20 }, { sessionId: 'test-session' });

            expect(mockClient.getGridIpsecFailover).toHaveBeenCalledWith(2, 20, undefined, undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridIpsecFailover as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridIpsecFailoverTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridIpsecFailover).toHaveBeenCalledWith(1, 10, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridIpsecFailover as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGridIpsecFailoverTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridIpsecFailover',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
