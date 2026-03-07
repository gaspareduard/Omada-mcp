import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetBeaconControlSettingTool } from '../../src/tools/getBeaconControlSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getBeaconControlSetting', () => {
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
            getBeaconControlSetting: vi.fn(),
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

    describe('registerGetBeaconControlSettingTool', () => {
        it('should register the getBeaconControlSetting tool with correct schema', () => {
            registerGetBeaconControlSettingTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getBeaconControlSetting', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = { beaconInterval: 100, dtimPeriod: 1 };
            (mockClient.getBeaconControlSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetBeaconControlSettingTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getBeaconControlSetting).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { beaconInterval: 100 };
            (mockClient.getBeaconControlSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetBeaconControlSettingTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getBeaconControlSetting).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle empty response', async () => {
            (mockClient.getBeaconControlSetting as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetBeaconControlSettingTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getBeaconControlSetting as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetBeaconControlSettingTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getBeaconControlSetting',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
