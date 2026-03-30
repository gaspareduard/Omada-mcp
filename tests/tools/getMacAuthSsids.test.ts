import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetMacAuthSsidsTool } from '../../src/tools/getMacAuthSsids.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getMacAuthSsids', () => {
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
            getMacAuthSsids: vi.fn(),
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

    describe('registerGetMacAuthSsidsTool', () => {
        it('should register the getMacAuthSsids tool with correct schema', () => {
            registerGetMacAuthSsidsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getMacAuthSsids', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = [{ ssidName: 'MySSID', macAuthEnabled: true }];
            (mockClient.getMacAuthSsids as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetMacAuthSsidsTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getMacAuthSsids).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ ssidName: 'Corp', macAuthEnabled: false }];
            (mockClient.getMacAuthSsids as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetMacAuthSsidsTool(mockServer, mockClient);
            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getMacAuthSsids).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getMacAuthSsids as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetMacAuthSsidsTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getMacAuthSsids as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetMacAuthSsidsTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getMacAuthSsids',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
