import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetUrlGroupProfileTool } from '../../src/tools/getUrlGroupProfile.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getUrlGroupProfile', () => {
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

    describe('registerGetUrlGroupProfileTool', () => {
        it('should register with [DEPRECATED] in description', () => {
            registerGetUrlGroupProfileTool(mockServer, mockClient);
            const call = (mockServer.registerTool as ReturnType<typeof vi.fn>).mock.calls[0];
            expect(call[0]).toBe('getUrlGroupProfile');
            expect(call[1].description).toMatch(/\[DEPRECATED\]/);
        });

        it('should call getGroupProfilesByType with hardcoded groupType "1"', async () => {
            (mockClient.getGroupProfilesByType as ReturnType<typeof vi.fn>).mockResolvedValue([]);
            registerGetUrlGroupProfileTool(mockServer, mockClient);
            await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getGroupProfilesByType).toHaveBeenCalledWith('1', undefined, undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getGroupProfilesByType as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetUrlGroupProfileTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
