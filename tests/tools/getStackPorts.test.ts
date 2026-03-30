import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetStackPortsTool } from '../../src/tools/getStackPorts.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getStackPorts', () => {
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
            getStackPorts: vi.fn(),
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

    describe('registerGetStackPortsTool', () => {
        it('should register the getStackPorts tool with correct schema', () => {
            registerGetStackPortsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getStackPorts', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with required stackId', async () => {
            const mockData = { result: { data: [] } };
            (mockClient.getStackPorts as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetStackPortsTool(mockServer, mockClient);
            const result = await toolHandler({ stackId: 'stack-123' }, { sessionId: 'test-session' });
            expect(mockClient.getStackPorts).toHaveBeenCalledWith('stack-123', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with stackId and siteId', async () => {
            const mockData = { result: { data: [{ portId: 1 }] } };
            (mockClient.getStackPorts as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetStackPortsTool(mockServer, mockClient);
            const result = await toolHandler({ stackId: 'stack-123', siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getStackPorts).toHaveBeenCalledWith('stack-123', 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getStackPorts as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetStackPortsTool(mockServer, mockClient);
            await expect(toolHandler({ stackId: 'stack-123' }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getStackPorts',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
