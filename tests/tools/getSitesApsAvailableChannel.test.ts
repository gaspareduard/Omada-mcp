import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSitesApsAvailableChannelTool } from '../../src/tools/getSitesApsAvailableChannel.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSitesApsAvailableChannel', () => {
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
            getSitesApsAvailableChannel: vi.fn(),
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

    describe('registerGetSitesApsAvailableChannelTool', () => {
        it('should register with correct name', () => {
            registerGetSitesApsAvailableChannelTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesApsAvailableChannel', expect.any(Object), expect.any(Function));
        });

        it('should return tool result on success', async () => {
            const mockData = { channels: [1, 6, 11] };
            (mockClient.getSitesApsAvailableChannel as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetSitesApsAvailableChannelTool(mockServer, mockClient);

            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getSitesApsAvailableChannel).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId when provided', async () => {
            (mockClient.getSitesApsAvailableChannel as ReturnType<typeof vi.fn>).mockResolvedValue({});

            registerGetSitesApsAvailableChannelTool(mockServer, mockClient);

            await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF', siteId: 'site-1' }, {});

            expect(mockClient.getSitesApsAvailableChannel).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'site-1', undefined);
        });

        it('should return empty content on undefined response', async () => {
            (mockClient.getSitesApsAvailableChannel as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetSitesApsAvailableChannelTool(mockServer, mockClient);

            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, {});

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSitesApsAvailableChannel as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetSitesApsAvailableChannelTool(mockServer, mockClient);

            await expect(toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test' })).rejects.toThrow('API error');
        });
    });
});
