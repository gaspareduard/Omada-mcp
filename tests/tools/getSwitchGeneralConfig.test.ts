import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSwitchGeneralConfigTool } from '../../src/tools/getSwitchGeneralConfig.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSwitchGeneralConfig', () => {
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
            getSwitchGeneralConfig: vi.fn(),
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

    describe('registerGetSwitchGeneralConfigTool', () => {
        it('should register the getSwitchGeneralConfig tool with correct schema', () => {
            registerGetSwitchGeneralConfigTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSwitchGeneralConfig', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with switchMac', async () => {
            const mockData = { name: 'Core-Switch', ledEnabled: true };
            (mockClient.getSwitchGeneralConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSwitchGeneralConfigTool(mockServer, mockClient);
            const result = await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });
            expect(mockClient.getSwitchGeneralConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with switchMac and siteId', async () => {
            const mockData = { name: 'Access-Switch', ledEnabled: false };
            (mockClient.getSwitchGeneralConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSwitchGeneralConfigTool(mockServer, mockClient);
            const result = await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getSwitchGeneralConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSwitchGeneralConfig as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetSwitchGeneralConfigTool(mockServer, mockClient);
            await expect(toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getSwitchGeneralConfig',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
