import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListRadiusProfilesTool } from '../../src/tools/listRadiusProfiles.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listRadiusProfiles', () => {
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
            listRadiusProfiles: vi.fn(),
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

    describe('registerListRadiusProfilesTool', () => {
        it('should register the listRadiusProfiles tool with correct schema', () => {
            registerListRadiusProfilesTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listRadiusProfiles', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = [{ id: 'radius-1', name: 'Corp RADIUS', serverIp: '10.0.0.1', port: 1812 }];
            (mockClient.listRadiusProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListRadiusProfilesTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listRadiusProfiles).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ id: 'radius-1', name: 'Corp RADIUS', serverIp: '10.0.0.1', port: 1812 }];
            (mockClient.listRadiusProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListRadiusProfilesTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listRadiusProfiles).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listRadiusProfiles as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListRadiusProfilesTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listRadiusProfiles',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
