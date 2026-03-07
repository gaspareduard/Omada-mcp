import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListTimeRangeProfilesTool } from '../../src/tools/listTimeRangeProfiles.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listTimeRangeProfiles', () => {
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
            listTimeRangeProfiles: vi.fn(),
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

    describe('registerListTimeRangeProfilesTool', () => {
        it('should register the listTimeRangeProfiles tool with correct schema', () => {
            registerListTimeRangeProfilesTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listTimeRangeProfiles', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = [{ id: 'tr-1', name: 'Business Hours' }];
            (mockClient.listTimeRangeProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListTimeRangeProfilesTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listTimeRangeProfiles).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ id: 'tr-1', name: 'Business Hours' }];
            (mockClient.listTimeRangeProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListTimeRangeProfilesTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listTimeRangeProfiles).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listTimeRangeProfiles as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListTimeRangeProfilesTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listTimeRangeProfiles',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
