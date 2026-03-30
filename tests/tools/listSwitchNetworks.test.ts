import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListSwitchNetworksTool } from '../../src/tools/listSwitchNetworks.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listSwitchNetworks', () => {
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
            listSwitchNetworks: vi.fn(),
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

    describe('registerListSwitchNetworksTool', () => {
        it('should register the listSwitchNetworks tool with correct schema', () => {
            registerListSwitchNetworksTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listSwitchNetworks', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with required switchMac arg', async () => {
            const mockData = [{ port: 1, vlan: 10, tagged: false }];
            (mockClient.listSwitchNetworks as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSwitchNetworksTool(mockServer, mockClient);

            const result = await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.listSwitchNetworks).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass all args when provided', async () => {
            const mockData = [{ port: 1, vlan: 10, tagged: false }];
            (mockClient.listSwitchNetworks as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSwitchNetworksTool(mockServer, mockClient);

            await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF', page: 2, pageSize: 20, siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listSwitchNetworks).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 2, 20, 'test-site', undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = [];
            (mockClient.listSwitchNetworks as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSwitchNetworksTool(mockServer, mockClient);

            await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listSwitchNetworks).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listSwitchNetworks as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListSwitchNetworksTool(mockServer, mockClient);

            await expect(toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listSwitchNetworks',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
