import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListSiteToSiteVpnsTool } from '../../src/tools/listSiteToSiteVpns.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listSiteToSiteVpns', () => {
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
            listSiteToSiteVpns: vi.fn(),
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

    describe('registerListSiteToSiteVpnsTool', () => {
        it('should register the listSiteToSiteVpns tool with correct schema', () => {
            registerListSiteToSiteVpnsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listSiteToSiteVpns', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = [{ id: 'vpn-1', name: 'HQ to Branch', protocol: 'IPsec', status: 'connected' }];
            (mockClient.listSiteToSiteVpns as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSiteToSiteVpnsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listSiteToSiteVpns).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ id: 'vpn-1', name: 'HQ to Branch', protocol: 'IPsec', status: 'connected' }];
            (mockClient.listSiteToSiteVpns as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSiteToSiteVpnsTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listSiteToSiteVpns).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listSiteToSiteVpns as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListSiteToSiteVpnsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listSiteToSiteVpns',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
