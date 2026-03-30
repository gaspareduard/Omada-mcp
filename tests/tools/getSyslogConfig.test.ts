import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSyslogConfigTool } from '../../src/tools/getSyslogConfig.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSyslogConfig', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((_, __, h) => {
                toolHandler = h;
            }),
        } as unknown as McpServer;
        mockClient = { getRemoteLogging: vi.fn() } as unknown as OmadaClient;
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

    it('should register the tool', () => {
        registerGetSyslogConfigTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('getSyslogConfig', expect.any(Object), expect.any(Function));
    });

    it('should execute with no args', async () => {
        const mockData = { host: '10.0.0.1', port: 514 };
        (mockClient.getRemoteLogging as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
        registerGetSyslogConfigTool(mockServer, mockClient);
        const result = await toolHandler({}, { sessionId: 'test' });
        expect(mockClient.getRemoteLogging).toHaveBeenCalledWith(undefined);
        expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
    });

    it('should handle errors', async () => {
        (mockClient.getRemoteLogging as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
        registerGetSyslogConfigTool(mockServer, mockClient);
        await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
    });
});
