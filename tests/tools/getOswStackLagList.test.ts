import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetOswStackLagListTool } from '../../src/tools/getOswStackLagList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getOswStackLagList', () => {
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
            getOswStackLagList: vi.fn(),
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

    describe('registerGetOswStackLagListTool', () => {
        it('should register the getOswStackLagList tool with correct schema', () => {
            registerGetOswStackLagListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getOswStackLagList', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with required stackId', async () => {
            const mockData = [{ lagId: 'lag-1', ports: ['1', '2'], mode: 'lacp' }];
            (mockClient.getOswStackLagList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetOswStackLagListTool(mockServer, mockClient);
            const result = await toolHandler({ stackId: 'stack-123' }, { sessionId: 'test-session' });
            expect(mockClient.getOswStackLagList).toHaveBeenCalledWith('stack-123', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ lagId: 'lag-2' }];
            (mockClient.getOswStackLagList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetOswStackLagListTool(mockServer, mockClient);
            await toolHandler({ stackId: 'stack-123', siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getOswStackLagList).toHaveBeenCalledWith('stack-123', 'test-site', undefined);
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getOswStackLagList as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetOswStackLagListTool(mockServer, mockClient);
            const result = await toolHandler({ stackId: 'stack-123' }, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getOswStackLagList as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetOswStackLagListTool(mockServer, mockClient);
            await expect(toolHandler({ stackId: 'stack-123' }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getOswStackLagList',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
