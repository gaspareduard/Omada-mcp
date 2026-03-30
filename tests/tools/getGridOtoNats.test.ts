import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridOtoNatsTool } from '../../src/tools/getGridOtoNats.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridOtoNats', () => {
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
            getGridOtoNats: vi.fn(),
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

    describe('registerGetGridOtoNatsTool', () => {
        it('should register the getGridOtoNats tool with correct schema', () => {
            registerGetGridOtoNatsTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridOtoNats', expect.any(Object), expect.any(Function));
        });

        it('should successfully get 1:1 NAT rules with defaults', async () => {
            const mockData = { data: [{ publicIp: '203.0.113.10', privateIp: '192.168.1.10' }], totalRows: 1 };

            (mockClient.getGridOtoNats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridOtoNatsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getGridOtoNats).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination and siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridOtoNats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridOtoNatsTool(mockServer, mockClient);

            await toolHandler({ page: 2, pageSize: 20, siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridOtoNats).toHaveBeenCalledWith(2, 20, 'test-site', undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridOtoNats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridOtoNatsTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridOtoNats).toHaveBeenCalledWith(undefined, undefined, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridOtoNats as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGridOtoNatsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridOtoNats',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
