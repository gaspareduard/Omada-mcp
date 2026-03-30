import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridPolicyRoutingTool } from '../../src/tools/getGridPolicyRouting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridPolicyRouting', () => {
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
            getGridPolicyRouting: vi.fn(),
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

    describe('registerGetGridPolicyRoutingTool', () => {
        it('should register the getGridPolicyRouting tool with correct schema', () => {
            registerGetGridPolicyRoutingTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridPolicyRouting', expect.any(Object), expect.any(Function));
        });

        it('should successfully get policy routing rules with defaults', async () => {
            const mockData = { data: [{ id: '1', srcIp: '192.168.1.0/24', dstIp: '10.0.0.0/8', interface: 'WAN1' }], totalRows: 1 };

            (mockClient.getGridPolicyRouting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridPolicyRoutingTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getGridPolicyRouting).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination and siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridPolicyRouting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridPolicyRoutingTool(mockServer, mockClient);

            await toolHandler({ page: 2, pageSize: 20, siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridPolicyRouting).toHaveBeenCalledWith(2, 20, 'test-site', undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridPolicyRouting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridPolicyRoutingTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridPolicyRouting).toHaveBeenCalledWith(undefined, undefined, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridPolicyRouting as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGridPolicyRoutingTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridPolicyRouting',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
