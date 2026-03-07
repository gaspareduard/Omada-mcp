import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRadioFrequencyPlanningResultTool } from '../../src/tools/getRadioFrequencyPlanningResult.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRadioFrequencyPlanningResult', () => {
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
            getRadioFrequencyPlanningResult: vi.fn(),
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

    describe('registerGetRadioFrequencyPlanningResultTool', () => {
        it('should register the getRadioFrequencyPlanningResult tool with correct schema', () => {
            registerGetRadioFrequencyPlanningResultTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRadioFrequencyPlanningResult', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { assignments: [{ ap: 'ap-1', channel: 6, power: 20 }] };
            (mockClient.getRadioFrequencyPlanningResult as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRadioFrequencyPlanningResultTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getRadioFrequencyPlanningResult).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { assignments: [] };
            (mockClient.getRadioFrequencyPlanningResult as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRadioFrequencyPlanningResultTool(mockServer, mockClient);
            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getRadioFrequencyPlanningResult).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getRadioFrequencyPlanningResult as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetRadioFrequencyPlanningResultTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getRadioFrequencyPlanningResult as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetRadioFrequencyPlanningResultTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getRadioFrequencyPlanningResult',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
