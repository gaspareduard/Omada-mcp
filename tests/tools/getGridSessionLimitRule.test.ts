import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridSessionLimitRuleTool } from '../../src/tools/getGridSessionLimitRule.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridSessionLimitRule', () => {
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
            getGridSessionLimitRule: vi.fn(),
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

    describe('registerGetGridSessionLimitRuleTool', () => {
        it('should register the getGridSessionLimitRule tool with correct schema', () => {
            registerGetGridSessionLimitRuleTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridSessionLimitRule', expect.any(Object), expect.any(Function));
        });

        it('should successfully get session limit rules with defaults', async () => {
            const mockData = { data: [{ id: '1', maxSessions: 1000, srcIp: '192.168.1.0/24' }], totalRows: 1 };

            (mockClient.getGridSessionLimitRule as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridSessionLimitRuleTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getGridSessionLimitRule).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination and siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridSessionLimitRule as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridSessionLimitRuleTool(mockServer, mockClient);

            await toolHandler({ page: 2, pageSize: 20, siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridSessionLimitRule).toHaveBeenCalledWith(2, 20, 'test-site', undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridSessionLimitRule as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridSessionLimitRuleTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridSessionLimitRule).toHaveBeenCalledWith(undefined, undefined, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridSessionLimitRule as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGridSessionLimitRuleTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridSessionLimitRule',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
