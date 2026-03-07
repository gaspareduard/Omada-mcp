import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetApSnmpConfigTool } from '../../src/tools/getApSnmpConfig.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getApSnmpConfig', () => {
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
            getApSnmpConfig: vi.fn(),
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

    describe('registerGetApSnmpConfigTool', () => {
        it('should register the getApSnmpConfig tool with correct schema', () => {
            registerGetApSnmpConfigTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getApSnmpConfig', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with apMac', async () => {
            const mockData = { enabled: true, version: 'v2c', communityString: 'public' };
            (mockClient.getApSnmpConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetApSnmpConfigTool(mockServer, mockClient);

            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getApSnmpConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { enabled: true };
            (mockClient.getApSnmpConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetApSnmpConfigTool(mockServer, mockClient);

            await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getApSnmpConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
        });

        it('should handle empty response', async () => {
            (mockClient.getApSnmpConfig as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetApSnmpConfigTool(mockServer, mockClient);

            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getApSnmpConfig as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetApSnmpConfigTool(mockServer, mockClient);

            await expect(toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getApSnmpConfig',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
