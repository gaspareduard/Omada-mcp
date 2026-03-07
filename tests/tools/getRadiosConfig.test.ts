import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRadiosConfigTool } from '../../src/tools/getRadiosConfig.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRadiosConfig', () => {
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
            getRadiosConfig: vi.fn(),
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

    describe('registerGetRadiosConfigTool', () => {
        it('should register the getRadiosConfig tool with correct schema', () => {
            registerGetRadiosConfigTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRadiosConfig', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with required apMac', async () => {
            const mockData = [{ band: '2.4GHz', channel: 6, txPower: 20 }];
            (mockClient.getRadiosConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRadiosConfigTool(mockServer, mockClient);
            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });
            expect(mockClient.getRadiosConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ band: '5GHz', channel: 36 }];
            (mockClient.getRadiosConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRadiosConfigTool(mockServer, mockClient);
            await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getRadiosConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getRadiosConfig as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetRadiosConfigTool(mockServer, mockClient);
            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getRadiosConfig as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetRadiosConfigTool(mockServer, mockClient);
            await expect(toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getRadiosConfig',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
