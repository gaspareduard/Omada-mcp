import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetBandSteeringSettingTool } from '../../src/tools/getBandSteeringSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getBandSteeringSetting', () => {
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
            getBandSteeringSetting: vi.fn(),
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

    describe('registerGetBandSteeringSettingTool', () => {
        it('should register the getBandSteeringSetting tool with correct schema', () => {
            registerGetBandSteeringSettingTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getBandSteeringSetting', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = { enabled: true, minRssiFor5g: -70 };
            (mockClient.getBandSteeringSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetBandSteeringSettingTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getBandSteeringSetting).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { enabled: true };
            (mockClient.getBandSteeringSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetBandSteeringSettingTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getBandSteeringSetting).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle empty response', async () => {
            (mockClient.getBandSteeringSetting as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetBandSteeringSettingTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getBandSteeringSetting as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetBandSteeringSettingTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getBandSteeringSetting',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
