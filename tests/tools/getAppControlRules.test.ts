import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAppControlRulesTool } from '../../src/tools/getAppControlRules.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getAppControlRules', () => {
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
            getAppControlRules: vi.fn(),
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

    describe('registerGetAppControlRulesTool', () => {
        it('should register the tool', () => {
            registerGetAppControlRulesTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getAppControlRules', expect.any(Object), expect.any(Function));
        });

        it('should execute with pagination', async () => {
            const mockData = { data: [{ name: 'rule1' }] };
            (mockClient.getAppControlRules as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetAppControlRulesTool(mockServer, mockClient);
            const result = await toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' });
            expect(mockClient.getAppControlRules).toHaveBeenCalledWith(1, 10, undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getAppControlRules as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetAppControlRulesTool(mockServer, mockClient);
            await toolHandler({ page: 1, pageSize: 10, siteId: 'site-x' }, { sessionId: 'test' });
            expect(mockClient.getAppControlRules).toHaveBeenCalledWith(1, 10, 'site-x', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getAppControlRules as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetAppControlRulesTool(mockServer, mockClient);
            await expect(toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
