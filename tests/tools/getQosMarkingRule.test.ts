import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetQosMarkingRuleTool } from '../../src/tools/getQosMarkingRule.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getQosMarkingRule', () => {
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
            getQosPolicy: vi.fn(),
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

    describe('registerGetQosMarkingRuleTool', () => {
        it('should register with [DEPRECATED] in description', () => {
            registerGetQosMarkingRuleTool(mockServer, mockClient);
            const call = (mockServer.registerTool as ReturnType<typeof vi.fn>).mock.calls[0];
            expect(call[0]).toBe('getQosMarkingRule');
            expect(call[1].description).toMatch(/\[DEPRECATED\]/);
        });

        it('should delegate to getQosPolicy', async () => {
            const mockData = {};
            (mockClient.getQosPolicy as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetQosMarkingRuleTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getQosPolicy).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getQosPolicy as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetQosMarkingRuleTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
