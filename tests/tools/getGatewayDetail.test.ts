import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGatewayDetailTool } from '../../src/tools/getGatewayDetail.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGatewayDetail', () => {
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
            getGatewayDetail: vi.fn(),
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

    describe('registerGetGatewayDetailTool', () => {
        it('should register the getGatewayDetail tool with correct schema', () => {
            registerGetGatewayDetailTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGatewayDetail', expect.any(Object), expect.any(Function));
        });

        it('should successfully get gateway detail', async () => {
            const mockData = { mac: 'AA-BB-CC-DD-EE-FF', model: 'ER7206', firmware: '1.2.3' };

            (mockClient.getGatewayDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGatewayDetailTool(mockServer, mockClient);

            const result = await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getGatewayDetail).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { mac: 'AA-BB-CC-DD-EE-FF', model: 'ER7206', firmware: '1.2.3' };

            (mockClient.getGatewayDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGatewayDetailTool(mockServer, mockClient);

            await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGatewayDetail).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
        });

        it('should handle undefined response', async () => {
            (mockClient.getGatewayDetail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetGatewayDetailTool(mockServer, mockClient);

            const result = await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGatewayDetail as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGatewayDetailTool(mockServer, mockClient);

            await expect(toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGatewayDetail',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
