import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListGroupProfilesTool } from '../../src/tools/listGroupProfiles.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listGroupProfiles', () => {
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
            listGroupProfiles: vi.fn(),
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

    describe('registerListGroupProfilesTool', () => {
        it('should register the listGroupProfiles tool with correct schema', () => {
            registerListGroupProfilesTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listGroupProfiles', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = [{ id: 'group-1', name: 'IP Group 1', type: 'ip' }];
            (mockClient.listGroupProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListGroupProfilesTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listGroupProfiles).toHaveBeenCalledWith(undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass groupType and siteId when provided', async () => {
            const mockData = [{ id: 'group-1', name: 'IP Group 1', type: 'ip' }];
            (mockClient.listGroupProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListGroupProfilesTool(mockServer, mockClient);

            await toolHandler({ groupType: 'ip', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listGroupProfiles).toHaveBeenCalledWith('ip', 'test-site', undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = [];
            (mockClient.listGroupProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListGroupProfilesTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listGroupProfiles).toHaveBeenCalledWith(undefined, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listGroupProfiles as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListGroupProfilesTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listGroupProfiles',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
