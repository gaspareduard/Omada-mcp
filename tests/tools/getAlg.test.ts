import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAlgTool } from '../../src/tools/getAlg.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getAlg', () => {
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
            getAlg: vi.fn(),
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

    describe('registerGetAlgTool', () => {
        it('should register the getAlg tool with correct schema', () => {
            registerGetAlgTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getAlg', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = { sipEnabled: true, ftpEnabled: false };
            (mockClient.getAlg as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetAlgTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getAlg).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { sipEnabled: true, ftpEnabled: false };
            (mockClient.getAlg as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetAlgTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getAlg).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle empty response', async () => {
            (mockClient.getAlg as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetAlgTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getAlg as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetAlgTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getAlg',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
