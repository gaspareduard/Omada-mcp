import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridSignatureTool } from '../../src/tools/getGridSignature.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridSignature', () => {
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
            getGridSignature: vi.fn(),
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

    describe('registerGetGridSignatureTool', () => {
        it('should register the getGridSignature tool with correct schema', () => {
            registerGetGridSignatureTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridSignature', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with default pagination', async () => {
            const mockData = { result: 'signature list' };
            (mockClient.getGridSignature as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetGridSignatureTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getGridSignature).toHaveBeenCalledWith(1, 10, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with custom pagination', async () => {
            const mockData = { result: 'signature list' };
            (mockClient.getGridSignature as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetGridSignatureTool(mockServer, mockClient);
            const result = await toolHandler({ page: 2, pageSize: 20 }, { sessionId: 'test-session' });
            expect(mockClient.getGridSignature).toHaveBeenCalledWith(2, 20, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { result: 'signature list' };
            (mockClient.getGridSignature as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetGridSignatureTool(mockServer, mockClient);
            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getGridSignature).toHaveBeenCalledWith(1, 10, 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridSignature as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetGridSignatureTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridSignature',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
