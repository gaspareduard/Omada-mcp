import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridIpMacBindingTool } from '../../src/tools/getGridIpMacBinding.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridIpMacBinding', () => {
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
            getGridIpMacBinding: vi.fn(),
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

    describe('registerGetGridIpMacBindingTool', () => {
        it('should register the getGridIpMacBinding tool with correct schema', () => {
            registerGetGridIpMacBindingTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridIpMacBinding', expect.any(Object), expect.any(Function));
        });

        it('should successfully get IP-MAC binding entries with defaults', async () => {
            const mockData = { data: [{ mac: 'AA-BB-CC-DD-EE-FF', ip: '192.168.1.100' }], totalRows: 1 };

            (mockClient.getGridIpMacBinding as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridIpMacBindingTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getGridIpMacBinding).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination and siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridIpMacBinding as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridIpMacBindingTool(mockServer, mockClient);

            await toolHandler({ page: 2, pageSize: 20, siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridIpMacBinding).toHaveBeenCalledWith(2, 20, 'test-site', undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridIpMacBinding as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridIpMacBindingTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridIpMacBinding).toHaveBeenCalledWith(undefined, undefined, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridIpMacBinding as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGridIpMacBindingTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridIpMacBinding',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
