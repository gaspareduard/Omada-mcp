import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGatewayLanStatusTool } from '../../src/tools/getGatewayLanStatus.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGatewayLanStatus', () => {
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
            getGatewayLanStatus: vi.fn(),
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

    describe('registerGetGatewayLanStatusTool', () => {
        it('should register the getGatewayLanStatus tool with correct schema', () => {
            registerGetGatewayLanStatusTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGatewayLanStatus', expect.any(Object), expect.any(Function));
        });

        it('should successfully get gateway LAN status', async () => {
            const mockData = { ports: [{ portId: 1, linkState: 'up', speed: '1000M' }] };

            (mockClient.getGatewayLanStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGatewayLanStatusTool(mockServer, mockClient);

            const result = await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getGatewayLanStatus).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { ports: [] };

            (mockClient.getGatewayLanStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGatewayLanStatusTool(mockServer, mockClient);

            await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGatewayLanStatus).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
        });

        it('should handle undefined response', async () => {
            (mockClient.getGatewayLanStatus as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetGatewayLanStatusTool(mockServer, mockClient);

            const result = await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGatewayLanStatus as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGatewayLanStatusTool(mockServer, mockClient);

            await expect(toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGatewayLanStatus',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
