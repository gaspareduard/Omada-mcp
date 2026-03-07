import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListPortForwardingRulesTool } from '../../src/tools/listPortForwardingRules.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listPortForwardingRules', () => {
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
            listPortForwardingRules: vi.fn(),
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

    describe('registerListPortForwardingRulesTool', () => {
        it('should register the listPortForwardingRules tool with correct schema', () => {
            registerListPortForwardingRulesTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listPortForwardingRules', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = [{ id: 'rule-1', name: 'Web Server', externalPort: 80, internalIp: '192.168.1.10' }];
            (mockClient.listPortForwardingRules as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListPortForwardingRulesTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listPortForwardingRules).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ id: 'rule-1', name: 'Web Server', externalPort: 80, internalIp: '192.168.1.10' }];
            (mockClient.listPortForwardingRules as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListPortForwardingRulesTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listPortForwardingRules).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listPortForwardingRules as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListPortForwardingRulesTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listPortForwardingRules',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
