import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGroupProfilesByTypeTool } from '../../src/tools/getGroupProfilesByType.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGroupProfilesByType', () => {
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
            getGroupProfilesByType: vi.fn(),
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

    describe('registerGetGroupProfilesByTypeTool', () => {
        it('should register the getGroupProfilesByType tool with correct schema', () => {
            registerGetGroupProfilesByTypeTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getGroupProfilesByType', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with groupType 0 (IP Group)', async () => {
            const mockData = { result: 'ip groups' };
            (mockClient.getGroupProfilesByType as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetGroupProfilesByTypeTool(mockServer, mockClient);
            const result = await toolHandler({ groupType: '0' }, { sessionId: 'test-session' });
            expect(mockClient.getGroupProfilesByType).toHaveBeenCalledWith('0', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with groupType 1 (IP Port Group)', async () => {
            const mockData = { result: 'port groups' };
            (mockClient.getGroupProfilesByType as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetGroupProfilesByTypeTool(mockServer, mockClient);
            const result = await toolHandler({ groupType: '1' }, { sessionId: 'test-session' });
            expect(mockClient.getGroupProfilesByType).toHaveBeenCalledWith('1', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with groupType 2 and siteId', async () => {
            const mockData = { result: 'mac groups' };
            (mockClient.getGroupProfilesByType as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetGroupProfilesByTypeTool(mockServer, mockClient);
            const result = await toolHandler({ groupType: '2', siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getGroupProfilesByType).toHaveBeenCalledWith('2', 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGroupProfilesByType as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetGroupProfilesByTypeTool(mockServer, mockClient);
            await expect(toolHandler({ groupType: '0' }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGroupProfilesByType',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
