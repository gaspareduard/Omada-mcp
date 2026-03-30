import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetDashboardMostActiveSwitchesTool } from '../../src/tools/getDashboardMostActiveSwitches.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getDashboardMostActiveSwitches', () => {
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
            getDashboardMostActiveSwitches: vi.fn(),
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

    describe('registerGetDashboardMostActiveSwitchesTool', () => {
        it('should register the getDashboardMostActiveSwitches tool with correct schema', () => {
            registerGetDashboardMostActiveSwitchesTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDashboardMostActiveSwitches', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = [{ mac: 'AA-BB-CC-DD-EE-FF', traffic: 5000 }];
            (mockClient.getDashboardMostActiveSwitches as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDashboardMostActiveSwitchesTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getDashboardMostActiveSwitches).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ mac: 'AA-BB-CC-DD-EE-FF' }];
            (mockClient.getDashboardMostActiveSwitches as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDashboardMostActiveSwitchesTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getDashboardMostActiveSwitches).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getDashboardMostActiveSwitches as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetDashboardMostActiveSwitchesTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getDashboardMostActiveSwitches',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
