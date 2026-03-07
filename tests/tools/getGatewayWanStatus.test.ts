import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGatewayWanStatusTool } from '../../src/tools/getGatewayWanStatus.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGatewayWanStatus', () => {
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
            getGatewayWanStatus: vi.fn(),
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

    describe('registerGetGatewayWanStatusTool', () => {
        it('should register the getGatewayWanStatus tool with correct schema', () => {
            registerGetGatewayWanStatusTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGatewayWanStatus', expect.any(Object), expect.any(Function));
        });

        it('should successfully get gateway WAN status', async () => {
            const mockData = { wanPorts: [{ ip: '203.0.113.1', dns: '8.8.8.8', uptime: 3600 }] };

            (mockClient.getGatewayWanStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGatewayWanStatusTool(mockServer, mockClient);

            const result = await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getGatewayWanStatus).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { wanPorts: [] };

            (mockClient.getGatewayWanStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGatewayWanStatusTool(mockServer, mockClient);

            await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGatewayWanStatus).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
        });

        it('should handle undefined response', async () => {
            (mockClient.getGatewayWanStatus as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetGatewayWanStatusTool(mockServer, mockClient);

            const result = await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGatewayWanStatus as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGatewayWanStatusTool(mockServer, mockClient);

            await expect(toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGatewayWanStatus',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
