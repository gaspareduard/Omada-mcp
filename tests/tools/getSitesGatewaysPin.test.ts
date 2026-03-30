import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSitesGatewaysPinTool } from '../../src/tools/getSitesGatewaysPin.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSitesGatewaysPin', () => {
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
            getSitesGatewaysPin: vi.fn(),
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

    describe('registerGetSitesGatewaysPinTool', () => {
        it('should register the getSitesGatewaysPin tool with correct name', () => {
            registerGetSitesGatewaysPinTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesGatewaysPin', expect.any(Object), expect.any(Function));
        });

        it('should return tool result on success', async () => {
            const mockData = { pinEnabled: false };
            (mockClient.getSitesGatewaysPin as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetSitesGatewaysPinTool(mockServer, mockClient);

            const result = await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getSitesGatewaysPin).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId when provided', async () => {
            (mockClient.getSitesGatewaysPin as ReturnType<typeof vi.fn>).mockResolvedValue({});

            registerGetSitesGatewaysPinTool(mockServer, mockClient);

            await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF', siteId: 'site-1' }, {});

            expect(mockClient.getSitesGatewaysPin).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'site-1', undefined);
        });

        it('should return empty content on undefined response', async () => {
            (mockClient.getSitesGatewaysPin as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetSitesGatewaysPinTool(mockServer, mockClient);

            const result = await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, {});

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSitesGatewaysPin as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetSitesGatewaysPinTool(mockServer, mockClient);

            await expect(toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test' })).rejects.toThrow('API error');
        });
    });
});
