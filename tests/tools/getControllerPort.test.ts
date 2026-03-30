import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetControllerPortTool } from '../../src/tools/getControllerPort.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getControllerPort', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getControllerPort: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetControllerPortTool', () => {
        it('should register the tool', () => {
            registerGetControllerPortTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getControllerPort', expect.any(Object), expect.any(Function));
        });

        it('should call getControllerPort', async () => {
            const mockData = { id: 'port-1' };
            (mockClient.getControllerPort as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetControllerPortTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getControllerPort).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getControllerPort as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetControllerPortTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
