import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRogueApsTool } from '../../src/tools/getRogueAps.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRogueAps', () => {
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
            getRogueAps: vi.fn(),
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

    describe('registerGetRogueApsTool', () => {
        it('should register the getRogueAps tool with correct schema', () => {
            registerGetRogueApsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRogueAps', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { result: { data: [] } };
            (mockClient.getRogueAps as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRogueApsTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getRogueAps).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { result: { data: [{ mac: 'AA-BB-CC-DD-EE-FF' }] } };
            (mockClient.getRogueAps as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRogueApsTool(mockServer, mockClient);
            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getRogueAps).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getRogueAps as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetRogueApsTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getRogueAps',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
