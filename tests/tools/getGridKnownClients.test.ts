import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridKnownClientsTool } from '../../src/tools/getGridKnownClients.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridKnownClients', () => {
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
            getGridKnownClients: vi.fn(),
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

    describe('registerGetGridKnownClientsTool', () => {
        it('should register the getGridKnownClients tool with correct schema', () => {
            registerGetGridKnownClientsTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridKnownClients', expect.any(Object), expect.any(Function));
        });

        it('should successfully get known clients with defaults', async () => {
            const mockData = { data: [{ mac: 'AA-BB-CC-DD-EE-FF', name: 'Client 1', lastSeen: 1234567890 }], totalRows: 1 };

            (mockClient.getGridKnownClients as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridKnownClientsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getGridKnownClients).toHaveBeenCalledWith(
                1,
                10,
                { sortLastSeen: undefined, timeStart: undefined, timeEnd: undefined, guest: undefined, searchKey: undefined },
                undefined,
                undefined
            );
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass all filter params when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridKnownClients as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridKnownClientsTool(mockServer, mockClient);

            await toolHandler(
                {
                    page: 2,
                    pageSize: 20,
                    sortLastSeen: 'desc',
                    timeStart: '1700000000000',
                    timeEnd: '1700086400000',
                    guest: 'false',
                    searchKey: 'laptop',
                    siteId: 'test-site',
                },
                { sessionId: 'test-session' }
            );

            expect(mockClient.getGridKnownClients).toHaveBeenCalledWith(
                2,
                20,
                { sortLastSeen: 'desc', timeStart: '1700000000000', timeEnd: '1700086400000', guest: 'false', searchKey: 'laptop' },
                'test-site',
                undefined
            );
        });

        it('should pass siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridKnownClients as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridKnownClientsTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridKnownClients).toHaveBeenCalledWith(
                1,
                10,
                { sortLastSeen: undefined, timeStart: undefined, timeEnd: undefined, guest: undefined, searchKey: undefined },
                'test-site',
                undefined
            );
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridKnownClients as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGridKnownClientsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridKnownClients',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
