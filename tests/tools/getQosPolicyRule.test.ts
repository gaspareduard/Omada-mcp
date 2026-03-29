import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetQosPolicyRuleTool } from '../../src/tools/getQosPolicyRule.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getQosPolicyRule', () => {
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

    describe('registerGetQosPolicyRuleTool', () => {
        it('should register with [DEPRECATED] in description', () => {
            registerGetQosPolicyRuleTool(mockServer, mockClient);
            const call = (mockServer.registerTool as ReturnType<typeof vi.fn>).mock.calls[0];
            expect(call[0]).toBe('getQosPolicyRule');
            expect(call[1].description).toMatch(/\[DEPRECATED\]/);
        });

        it('should delegate to getQosPolicy', async () => {
            const mockData = { enabled: true };
            (mockClient.getQosPolicy as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetQosPolicyRuleTool(mockServer, mockClient);
            await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getQosPolicy).toHaveBeenCalledWith(undefined, undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getQosPolicy as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetQosPolicyRuleTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
