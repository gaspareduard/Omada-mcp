import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetPortalPortTool } from '../../src/tools/getPortalPort.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getPortalPort', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getPortalPort: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetPortalPortTool', () => {
        it('should register the tool', () => {
            registerGetPortalPortTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getPortalPort', expect.any(Object), expect.any(Function));
        });

        it('should call getPortalPort', async () => {
            const mockData = { id: 'portal-1' };
            (mockClient.getPortalPort as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetPortalPortTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getPortalPort).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getPortalPort as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetPortalPortTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
