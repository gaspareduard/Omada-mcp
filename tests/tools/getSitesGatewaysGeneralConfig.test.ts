import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSitesGatewaysGeneralConfigTool } from '../../src/tools/getSitesGatewaysGeneralConfig.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSitesGatewaysGeneralConfig', () => {
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
            getSitesGatewaysGeneralConfig: vi.fn(),
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

    describe('registerGetSitesGatewaysGeneralConfigTool', () => {
        it('should register the getSitesGatewaysGeneralConfig tool with correct name', () => {
            registerGetSitesGatewaysGeneralConfigTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesGatewaysGeneralConfig', expect.any(Object), expect.any(Function));
        });

        it('should return tool result on success', async () => {
            const mockData = { generalConfig: { enabled: true } };
            (mockClient.getSitesGatewaysGeneralConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetSitesGatewaysGeneralConfigTool(mockServer, mockClient);

            const result = await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getSitesGatewaysGeneralConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId and customHeaders when provided', async () => {
            const mockData = { generalConfig: {} };
            (mockClient.getSitesGatewaysGeneralConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetSitesGatewaysGeneralConfigTool(mockServer, mockClient);

            await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF', siteId: 'site-1', customHeaders: { 'X-Test': 'val' } }, {});

            expect(mockClient.getSitesGatewaysGeneralConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'site-1', { 'X-Test': 'val' });
        });

        it('should return empty content on undefined response', async () => {
            (mockClient.getSitesGatewaysGeneralConfig as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetSitesGatewaysGeneralConfigTool(mockServer, mockClient);

            const result = await toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, {});

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors and log them', async () => {
            const error = new Error('API error');
            (mockClient.getSitesGatewaysGeneralConfig as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetSitesGatewaysGeneralConfigTool(mockServer, mockClient);

            await expect(toolHandler({ gatewayMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getSitesGatewaysGeneralConfig',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
