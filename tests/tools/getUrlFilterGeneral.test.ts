import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetUrlFilterGeneralTool } from '../../src/tools/getUrlFilterGeneral.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getUrlFilterGeneral', () => {
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
            getUrlFilterGeneral: vi.fn(),
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

    describe('registerGetUrlFilterGeneralTool', () => {
        it('should register the getUrlFilterGeneral tool with correct schema', () => {
            registerGetUrlFilterGeneralTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getUrlFilterGeneral', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { enabled: true, defaultAction: 'allow' };
            (mockClient.getUrlFilterGeneral as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetUrlFilterGeneralTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getUrlFilterGeneral).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { enabled: false, defaultAction: 'deny' };
            (mockClient.getUrlFilterGeneral as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetUrlFilterGeneralTool(mockServer, mockClient);

            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getUrlFilterGeneral).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getUrlFilterGeneral as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetUrlFilterGeneralTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getUrlFilterGeneral',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
