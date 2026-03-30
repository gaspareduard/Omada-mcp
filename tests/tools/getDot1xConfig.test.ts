import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetDot1xConfigTool } from '../../src/tools/getDot1xConfig.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getDot1xConfig', () => {
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
            getSwitchDot1xSetting: vi.fn(),
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

    describe('registerGetDot1xConfigTool', () => {
        it('should register the getDot1xConfig tool', () => {
            registerGetDot1xConfigTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDot1xConfig', expect.any(Object), expect.any(Function));
        });

        it('should execute and return result', async () => {
            const mockData = { enabled: true, mode: 'port-based' };
            (mockClient.getSwitchDot1xSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetDot1xConfigTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getSwitchDot1xSetting).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getSwitchDot1xSetting as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetDot1xConfigTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getSwitchDot1xSetting).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSwitchDot1xSetting as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetDot1xConfigTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('API error');
        });
    });
});
