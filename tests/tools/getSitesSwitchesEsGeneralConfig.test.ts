import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSitesSwitchesEsGeneralConfigTool } from '../../src/tools/getSitesSwitchesEsGeneralConfig.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSitesSwitchesEsGeneralConfig', () => {
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
            getSitesSwitchesEsGeneralConfig: vi.fn(),
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

    describe('registerGetSitesSwitchesEsGeneralConfigTool', () => {
        it('should register with correct name', () => {
            registerGetSitesSwitchesEsGeneralConfigTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesSwitchesEsGeneralConfig', expect.any(Object), expect.any(Function));
        });

        it('should return tool result on success', async () => {
            const mockData = { jumpTo: 0, deviceName: 'Switch' };
            (mockClient.getSitesSwitchesEsGeneralConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetSitesSwitchesEsGeneralConfigTool(mockServer, mockClient);

            const result = await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getSitesSwitchesEsGeneralConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId when provided', async () => {
            (mockClient.getSitesSwitchesEsGeneralConfig as ReturnType<typeof vi.fn>).mockResolvedValue({});

            registerGetSitesSwitchesEsGeneralConfigTool(mockServer, mockClient);

            await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF', siteId: 'site-1' }, {});

            expect(mockClient.getSitesSwitchesEsGeneralConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'site-1', undefined);
        });

        it('should return empty content on undefined response', async () => {
            (mockClient.getSitesSwitchesEsGeneralConfig as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetSitesSwitchesEsGeneralConfigTool(mockServer, mockClient);

            const result = await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, {});

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSitesSwitchesEsGeneralConfig as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetSitesSwitchesEsGeneralConfigTool(mockServer, mockClient);

            await expect(toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test' })).rejects.toThrow('API error');
        });
    });
});
