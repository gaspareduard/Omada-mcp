import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSitesApsTrunkSettingTool } from '../../src/tools/getSitesApsTrunkSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSitesApsTrunkSetting', () => {
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
            getSitesApsTrunkSetting: vi.fn(),
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

    describe('registerGetSitesApsTrunkSettingTool', () => {
        it('should register with correct name', () => {
            registerGetSitesApsTrunkSettingTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesApsTrunkSetting', expect.any(Object), expect.any(Function));
        });

        it('should return tool result on success', async () => {
            const mockData = { trunkEnabled: true, vlanId: 100 };
            (mockClient.getSitesApsTrunkSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetSitesApsTrunkSettingTool(mockServer, mockClient);

            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getSitesApsTrunkSetting).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId when provided', async () => {
            (mockClient.getSitesApsTrunkSetting as ReturnType<typeof vi.fn>).mockResolvedValue({});

            registerGetSitesApsTrunkSettingTool(mockServer, mockClient);

            await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF', siteId: 'site-1' }, {});

            expect(mockClient.getSitesApsTrunkSetting).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'site-1', undefined);
        });

        it('should return empty content on undefined response', async () => {
            (mockClient.getSitesApsTrunkSetting as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetSitesApsTrunkSettingTool(mockServer, mockClient);

            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, {});

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSitesApsTrunkSetting as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetSitesApsTrunkSettingTool(mockServer, mockClient);

            await expect(toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test' })).rejects.toThrow('API error');
        });
    });
});
