import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListSitesCableTestSwitchesIncrementResultsTool } from '../../src/tools/listSitesCableTestSwitchesIncrementResults.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listSitesCableTestSwitchesIncrementResults', () => {
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
            listSitesCableTestSwitchesIncrementResults: vi.fn(),
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

    describe('registerListSitesCableTestSwitchesIncrementResultsTool', () => {
        it('should register with correct name', () => {
            registerListSitesCableTestSwitchesIncrementResultsTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith(
                'listSitesCableTestSwitchesIncrementResults',
                expect.any(Object),
                expect.any(Function)
            );
        });

        it('should return tool result on success', async () => {
            const mockData = { results: [{ portId: 1, status: 'ok' }] };
            (mockClient.listSitesCableTestSwitchesIncrementResults as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSitesCableTestSwitchesIncrementResultsTool(mockServer, mockClient);

            const result = await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.listSitesCableTestSwitchesIncrementResults).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId when provided', async () => {
            (mockClient.listSitesCableTestSwitchesIncrementResults as ReturnType<typeof vi.fn>).mockResolvedValue({});

            registerListSitesCableTestSwitchesIncrementResultsTool(mockServer, mockClient);

            await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF', siteId: 'site-1' }, {});

            expect(mockClient.listSitesCableTestSwitchesIncrementResults).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'site-1', undefined);
        });

        it('should return empty content on undefined response', async () => {
            (mockClient.listSitesCableTestSwitchesIncrementResults as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerListSitesCableTestSwitchesIncrementResultsTool(mockServer, mockClient);

            const result = await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, {});

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listSitesCableTestSwitchesIncrementResults as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListSitesCableTestSwitchesIncrementResultsTool(mockServer, mockClient);

            await expect(toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test' })).rejects.toThrow('API error');
        });
    });
});
