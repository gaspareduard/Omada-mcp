import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListSitesApsPortsTool } from '../../src/tools/listSitesApsPorts.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listSitesApsPorts', () => {
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
            listSitesApsPorts: vi.fn(),
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

    describe('registerListSitesApsPortsTool', () => {
        it('should register with correct name', () => {
            registerListSitesApsPortsTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('listSitesApsPorts', expect.any(Object), expect.any(Function));
        });

        it('should return tool result on success', async () => {
            const mockData = [{ portId: 1, name: 'LAN1' }];
            (mockClient.listSitesApsPorts as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSitesApsPortsTool(mockServer, mockClient);

            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.listSitesApsPorts).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId when provided', async () => {
            (mockClient.listSitesApsPorts as ReturnType<typeof vi.fn>).mockResolvedValue([]);

            registerListSitesApsPortsTool(mockServer, mockClient);

            await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF', siteId: 'site-1' }, {});

            expect(mockClient.listSitesApsPorts).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'site-1', undefined);
        });

        it('should return empty content on undefined response', async () => {
            (mockClient.listSitesApsPorts as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerListSitesApsPortsTool(mockServer, mockClient);

            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, {});

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listSitesApsPorts as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListSitesApsPortsTool(mockServer, mockClient);

            await expect(toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test' })).rejects.toThrow('API error');
        });
    });
});
