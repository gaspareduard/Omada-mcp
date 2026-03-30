import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAuditLogSettingForGlobalTool } from '../../src/tools/getAuditLogSettingForGlobal.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getAuditLogSettingForGlobal', () => {
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
            getAuditLogSettingForGlobal: vi.fn(),
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

    describe('registerGetAuditLogSettingForGlobalTool', () => {
        it('should register the getAuditLogSettingForGlobal tool with correct schema', () => {
            registerGetAuditLogSettingForGlobalTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getAuditLogSettingForGlobal', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = { enabled: true, recipients: ['admin@example.com'] };
            (mockClient.getAuditLogSettingForGlobal as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetAuditLogSettingForGlobalTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getAuditLogSettingForGlobal).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle empty response', async () => {
            (mockClient.getAuditLogSettingForGlobal as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetAuditLogSettingForGlobalTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getAuditLogSettingForGlobal as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetAuditLogSettingForGlobalTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getAuditLogSettingForGlobal',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
