import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGatewayQosClassRulesTool } from '../../src/tools/getGatewayQosClassRules.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGatewayQosClassRules', () => {
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
            getGatewayQosClassRules: vi.fn(),
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

    describe('registerGetGatewayQosClassRulesTool', () => {
        it('should register the tool', () => {
            registerGetGatewayQosClassRulesTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getGatewayQosClassRules', expect.any(Object), expect.any(Function));
        });

        it('should call client with pagination params', async () => {
            const mockData = { data: [] };
            (mockClient.getGatewayQosClassRules as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetGatewayQosClassRulesTool(mockServer, mockClient);
            await toolHandler({ page: 2, pageSize: 20 }, { sessionId: 'test' });
            expect(mockClient.getGatewayQosClassRules).toHaveBeenCalledWith(2, 20, undefined, undefined);
        });

        it('should pass siteId', async () => {
            (mockClient.getGatewayQosClassRules as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetGatewayQosClassRulesTool(mockServer, mockClient);
            await toolHandler({ page: 1, pageSize: 10, siteId: 'site-abc' }, { sessionId: 'test' });
            expect(mockClient.getGatewayQosClassRules).toHaveBeenCalledWith(1, 10, 'site-abc', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getGatewayQosClassRules as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetGatewayQosClassRulesTool(mockServer, mockClient);
            await expect(toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
