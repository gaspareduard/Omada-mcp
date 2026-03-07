import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAllDeviceBySiteTool } from '../../src/tools/getAllDeviceBySite.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getAllDeviceBySite', () => {
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
            getAllDeviceBySite: vi.fn(),
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

    describe('registerGetAllDeviceBySiteTool', () => {
        it('should register the getAllDeviceBySite tool with correct schema', () => {
            registerGetAllDeviceBySiteTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getAllDeviceBySite', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = [{ mac: 'AA-BB-CC-DD-EE-FF', name: 'AP-1' }];
            (mockClient.getAllDeviceBySite as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetAllDeviceBySiteTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getAllDeviceBySite).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ mac: 'AA-BB-CC-DD-EE-FF', name: 'AP-1' }];
            (mockClient.getAllDeviceBySite as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetAllDeviceBySiteTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getAllDeviceBySite).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle empty response', async () => {
            (mockClient.getAllDeviceBySite as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetAllDeviceBySiteTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getAllDeviceBySite as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetAllDeviceBySiteTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getAllDeviceBySite',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
