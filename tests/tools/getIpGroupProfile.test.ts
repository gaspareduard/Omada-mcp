import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetIpGroupProfileTool } from '../../src/tools/getIpGroupProfile.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getIpGroupProfile', () => {
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

    describe('registerGetIpGroupProfileTool', () => {
        it('should register with [DEPRECATED] in description', () => {
            registerGetIpGroupProfileTool(mockServer, mockClient);
            const call = (mockServer.registerTool as ReturnType<typeof vi.fn>).mock.calls[0];
            expect(call[0]).toBe('getIpGroupProfile');
            expect(call[1].description).toMatch(/\[DEPRECATED\]/);
        });

        it('should call getGroupProfilesByType with hardcoded groupType "0"', async () => {
            (mockClient.getGroupProfilesByType as ReturnType<typeof vi.fn>).mockResolvedValue([]);
            registerGetIpGroupProfileTool(mockServer, mockClient);
            await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getGroupProfilesByType).toHaveBeenCalledWith('0', undefined, undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getGroupProfilesByType as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetIpGroupProfileTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
