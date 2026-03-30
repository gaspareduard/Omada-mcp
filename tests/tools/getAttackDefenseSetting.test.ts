import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAttackDefenseSettingTool } from '../../src/tools/getAttackDefenseSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getAttackDefenseSetting', () => {
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
            getAttackDefenseSetting: vi.fn(),
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

    describe('registerGetAttackDefenseSettingTool', () => {
        it('should register the getAttackDefenseSetting tool with correct schema', () => {
            registerGetAttackDefenseSettingTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getAttackDefenseSetting', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = { floodProtection: true, synFloodThreshold: 1000 };
            (mockClient.getAttackDefenseSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetAttackDefenseSettingTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getAttackDefenseSetting).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { floodProtection: true };
            (mockClient.getAttackDefenseSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetAttackDefenseSettingTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getAttackDefenseSetting).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle empty response', async () => {
            (mockClient.getAttackDefenseSetting as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetAttackDefenseSettingTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getAttackDefenseSetting as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetAttackDefenseSettingTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getAttackDefenseSetting',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
