import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListServiceTypeTool } from '../../src/tools/listServiceType.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listServiceType', () => {
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
            listServiceType: vi.fn(),
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

    describe('registerListServiceTypeTool', () => {
        it('should register the listServiceType tool with correct schema', () => {
            registerListServiceTypeTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listServiceType', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args using defaults', async () => {
            const mockData = [{ id: 'svc-1', name: 'HTTP', protocol: 'tcp', port: '80' }];
            (mockClient.listServiceType as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListServiceTypeTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listServiceType).toHaveBeenCalledWith(1, 10, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass page and pageSize when provided', async () => {
            const mockData = [{ id: 'svc-1', name: 'HTTPS', protocol: 'tcp', port: '443' }];
            (mockClient.listServiceType as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListServiceTypeTool(mockServer, mockClient);

            await toolHandler({ page: 2, pageSize: 25 }, { sessionId: 'test-session' });

            expect(mockClient.listServiceType).toHaveBeenCalledWith(2, 25, undefined, undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = [];
            (mockClient.listServiceType as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListServiceTypeTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listServiceType).toHaveBeenCalledWith(1, 10, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listServiceType as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListServiceTypeTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listServiceType',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
