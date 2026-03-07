import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRemoteLoggingSettingTool } from '../../src/tools/getRemoteLoggingSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRemoteLoggingSetting', () => {
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
            getRemoteLoggingSetting: vi.fn(),
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

    describe('registerGetRemoteLoggingSettingTool', () => {
        it('should register the getRemoteLoggingSetting tool with correct schema', () => {
            registerGetRemoteLoggingSettingTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRemoteLoggingSetting', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { syslogServer: '10.0.0.2', port: 514, logLevel: 'info' };
            (mockClient.getRemoteLoggingSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRemoteLoggingSettingTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getRemoteLoggingSetting).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { syslogServer: '10.0.0.3', port: 514 };
            (mockClient.getRemoteLoggingSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRemoteLoggingSettingTool(mockServer, mockClient);
            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getRemoteLoggingSetting).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getRemoteLoggingSetting as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetRemoteLoggingSettingTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getRemoteLoggingSetting as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetRemoteLoggingSettingTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getRemoteLoggingSetting',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
