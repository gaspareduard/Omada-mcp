import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRadioFrequencyPlanningConfigTool } from '../../src/tools/getRadioFrequencyPlanningConfig.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRadioFrequencyPlanningConfig', () => {
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
            getRadioFrequencyPlanningConfig: vi.fn(),
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

    describe('registerGetRadioFrequencyPlanningConfigTool', () => {
        it('should register the getRadioFrequencyPlanningConfig tool with correct schema', () => {
            registerGetRadioFrequencyPlanningConfigTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRadioFrequencyPlanningConfig', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { enabled: true, bands: ['2.4GHz', '5GHz'] };
            (mockClient.getRadioFrequencyPlanningConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRadioFrequencyPlanningConfigTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getRadioFrequencyPlanningConfig).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { enabled: false };
            (mockClient.getRadioFrequencyPlanningConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRadioFrequencyPlanningConfigTool(mockServer, mockClient);
            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getRadioFrequencyPlanningConfig).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getRadioFrequencyPlanningConfig as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetRadioFrequencyPlanningConfigTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getRadioFrequencyPlanningConfig as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetRadioFrequencyPlanningConfigTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getRadioFrequencyPlanningConfig',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
