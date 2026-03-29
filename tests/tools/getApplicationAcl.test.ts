import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetApplicationAclTool } from '../../src/tools/getApplicationAcl.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getApplicationAcl', () => {
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

    describe('registerGetApplicationAclTool', () => {
        it('should register the getApplicationAcl tool with [DEPRECATED] in description', () => {
            registerGetApplicationAclTool(mockServer, mockClient);
            const call = (mockServer.registerTool as ReturnType<typeof vi.fn>).mock.calls[0];
            expect(call[0]).toBe('getApplicationAcl');
            expect(call[1].description).toMatch(/\[DEPRECATED\]/);
        });

        it('should delegate to getAppControlRules', async () => {
            const mockData = { data: [] };
            (mockClient.getAppControlRules as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetApplicationAclTool(mockServer, mockClient);
            await toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' });
            expect(mockClient.getAppControlRules).toHaveBeenCalledWith(1, 10, undefined, undefined);
        });

        it('should pass siteId', async () => {
            (mockClient.getAppControlRules as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetApplicationAclTool(mockServer, mockClient);
            await toolHandler({ page: 1, pageSize: 5, siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getAppControlRules).toHaveBeenCalledWith(1, 5, 'site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getAppControlRules as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetApplicationAclTool(mockServer, mockClient);
            await expect(toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
