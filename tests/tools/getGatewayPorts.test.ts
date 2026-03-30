import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGatewayPortsTool } from '../../src/tools/getGatewayPorts.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGatewayPorts', () => {
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
            getGatewayPorts: vi.fn(),
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

    describe('registerGetGatewayPortsTool', () => {
        it('should register the getGatewayPorts tool with correct schema', () => {
            registerGetGatewayPortsTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGatewayPorts', expect.any(Object), expect.any(Function));
        });

        it('should successfully get gateway ports', async () => {
            const mockData = { ports: [{ portId: 1, type: 'WAN', linkState: 'up', ip: '192.168.1.1' }] };

            (mockClient.getGatewayPorts as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGatewayPortsTool(mockServer, mockClient);

            const result = await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getGatewayPorts).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { ports: [] };

            (mockClient.getGatewayPorts as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGatewayPortsTool(mockServer, mockClient);

            await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGatewayPorts).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
        });

        it('should handle undefined response', async () => {
            (mockClient.getGatewayPorts as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetGatewayPortsTool(mockServer, mockClient);

            const result = await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGatewayPorts as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGatewayPortsTool(mockServer, mockClient);

            await expect(toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGatewayPorts',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
