import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSitesApsOfdmaTool } from '../../src/tools/getSitesApsOfdma.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSitesApsOfdma', () => {
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
            getSitesApsOfdma: vi.fn(),
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

    describe('registerGetSitesApsOfdmaTool', () => {
        it('should register with correct name', () => {
            registerGetSitesApsOfdmaTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesApsOfdma', expect.any(Object), expect.any(Function));
        });

        it('should return tool result on success', async () => {
            const mockData = { dlOfdma: true, ulOfdma: false };
            (mockClient.getSitesApsOfdma as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetSitesApsOfdmaTool(mockServer, mockClient);

            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getSitesApsOfdma).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId when provided', async () => {
            (mockClient.getSitesApsOfdma as ReturnType<typeof vi.fn>).mockResolvedValue({});

            registerGetSitesApsOfdmaTool(mockServer, mockClient);

            await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF', siteId: 'site-1' }, {});

            expect(mockClient.getSitesApsOfdma).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'site-1', undefined);
        });

        it('should return empty content on undefined response', async () => {
            (mockClient.getSitesApsOfdma as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetSitesApsOfdmaTool(mockServer, mockClient);

            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, {});

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSitesApsOfdma as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetSitesApsOfdmaTool(mockServer, mockClient);

            await expect(toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test' })).rejects.toThrow('API error');
        });
    });
});
