import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetWanPortsConfigTool } from '../../src/tools/getWanPortsConfig.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getWanPortsConfig', () => {
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
            getWanPortsConfig: vi.fn(),
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

    describe('registerGetWanPortsConfigTool', () => {
        it('should register the getWanPortsConfig tool with correct schema', () => {
            registerGetWanPortsConfigTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getWanPortsConfig', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = [{ port: 1, connectionType: 'dhcp', mtu: 1500 }];
            (mockClient.getWanPortsConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetWanPortsConfigTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getWanPortsConfig).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = [{ port: 2, connectionType: 'static', mtu: 1492 }];
            (mockClient.getWanPortsConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetWanPortsConfigTool(mockServer, mockClient);

            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getWanPortsConfig).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getWanPortsConfig as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetWanPortsConfigTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getWanPortsConfig',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
