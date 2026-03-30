import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetApLoadBalanceTool } from '../../src/tools/getApLoadBalance.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getApLoadBalance', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getApLoadBalance: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetApLoadBalanceTool', () => {
        it('should register the tool', () => {
            registerGetApLoadBalanceTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getApLoadBalance', expect.any(Object), expect.any(Function));
        });

        it('should call getApLoadBalance with apMac', async () => {
            const mockData = { id: 'lb-1' };
            (mockClient.getApLoadBalance as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetApLoadBalanceTool(mockServer, mockClient);
            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test' });
            expect(mockClient.getApLoadBalance).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getApLoadBalance as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetApLoadBalanceTool(mockServer, mockClient);
            await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF', siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getApLoadBalance).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getApLoadBalance as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetApLoadBalanceTool(mockServer, mockClient);
            await expect(toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
