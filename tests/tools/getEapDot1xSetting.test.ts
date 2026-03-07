import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetEapDot1xSettingTool } from '../../src/tools/getEapDot1xSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getEapDot1xSetting', () => {
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
            getEapDot1xSetting: vi.fn(),
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

    describe('registerGetEapDot1xSettingTool', () => {
        it('should register the getEapDot1xSetting tool with correct schema', () => {
            registerGetEapDot1xSettingTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getEapDot1xSetting', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { enabled: true, authMode: 'EAP-TLS' };
            (mockClient.getEapDot1xSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetEapDot1xSettingTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getEapDot1xSetting).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { enabled: false };
            (mockClient.getEapDot1xSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetEapDot1xSettingTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getEapDot1xSetting).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getEapDot1xSetting as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetEapDot1xSettingTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getEapDot1xSetting',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
