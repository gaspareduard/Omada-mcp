import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAclConfigTypeSettingTool } from '../../src/tools/getAclConfigTypeSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getAclConfigTypeSetting', () => {
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
            getAclConfigTypeSetting: vi.fn(),
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

    describe('registerGetAclConfigTypeSettingTool', () => {
        it('should register the getAclConfigTypeSetting tool with correct schema', () => {
            registerGetAclConfigTypeSettingTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getAclConfigTypeSetting', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = { aclType: 'L3' };
            (mockClient.getAclConfigTypeSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetAclConfigTypeSettingTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getAclConfigTypeSetting).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { aclType: 'L3' };
            (mockClient.getAclConfigTypeSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetAclConfigTypeSettingTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getAclConfigTypeSetting).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle empty response', async () => {
            (mockClient.getAclConfigTypeSetting as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetAclConfigTypeSettingTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getAclConfigTypeSetting as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetAclConfigTypeSettingTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getAclConfigTypeSetting',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
