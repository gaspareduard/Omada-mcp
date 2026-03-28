import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSitesGatewaysSimCardUsedTool } from '../../src/tools/getSitesGatewaysSimCardUsed.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSitesGatewaysSimCardUsed', () => {
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
            getSitesGatewaysSimCardUsed: vi.fn(),
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

    describe('registerGetSitesGatewaysSimCardUsedTool', () => {
        it('should register with correct name', () => {
            registerGetSitesGatewaysSimCardUsedTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesGatewaysSimCardUsed', expect.any(Object), expect.any(Function));
        });

        it('should return tool result on success', async () => {
            const mockData = { simCard: 'SIM1' };
            (mockClient.getSitesGatewaysSimCardUsed as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetSitesGatewaysSimCardUsedTool(mockServer, mockClient);

            const result = await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getSitesGatewaysSimCardUsed).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId when provided', async () => {
            (mockClient.getSitesGatewaysSimCardUsed as ReturnType<typeof vi.fn>).mockResolvedValue({});

            registerGetSitesGatewaysSimCardUsedTool(mockServer, mockClient);

            await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF', siteId: 'site-1' }, {});

            expect(mockClient.getSitesGatewaysSimCardUsed).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'site-1', undefined);
        });

        it('should return empty content on undefined response', async () => {
            (mockClient.getSitesGatewaysSimCardUsed as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetSitesGatewaysSimCardUsedTool(mockServer, mockClient);

            const result = await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, {});

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSitesGatewaysSimCardUsed as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetSitesGatewaysSimCardUsedTool(mockServer, mockClient);

            await expect(toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test' })).rejects.toThrow('API error');
        });
    });
});
