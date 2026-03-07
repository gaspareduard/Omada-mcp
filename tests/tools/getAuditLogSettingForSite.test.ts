import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAuditLogSettingForSiteTool } from '../../src/tools/getAuditLogSettingForSite.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getAuditLogSettingForSite', () => {
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
            getAuditLogSettingForSite: vi.fn(),
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

    describe('registerGetAuditLogSettingForSiteTool', () => {
        it('should register the getAuditLogSettingForSite tool with correct schema', () => {
            registerGetAuditLogSettingForSiteTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getAuditLogSettingForSite', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = { enabled: true, recipients: ['siteadmin@example.com'] };
            (mockClient.getAuditLogSettingForSite as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetAuditLogSettingForSiteTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getAuditLogSettingForSite).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { enabled: true };
            (mockClient.getAuditLogSettingForSite as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetAuditLogSettingForSiteTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getAuditLogSettingForSite).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle empty response', async () => {
            (mockClient.getAuditLogSettingForSite as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetAuditLogSettingForSiteTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getAuditLogSettingForSite as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetAuditLogSettingForSiteTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getAuditLogSettingForSite',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
