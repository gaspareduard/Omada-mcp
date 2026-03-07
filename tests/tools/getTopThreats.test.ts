import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetTopThreatsTool } from '../../src/tools/getTopThreats.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getTopThreats', () => {
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
            getTopThreats: vi.fn(),
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

    describe('registerGetTopThreatsTool', () => {
        it('should register the getTopThreats tool with correct schema', () => {
            registerGetTopThreatsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getTopThreats', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = [{ id: 'threat-1', count: 42 }];
            (mockClient.getTopThreats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetTopThreatsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getTopThreats).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getTopThreats as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetTopThreatsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getTopThreats',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
