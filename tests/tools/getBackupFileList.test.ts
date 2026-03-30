import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetBackupFileListTool } from '../../src/tools/getBackupFileList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getBackupFileList', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getBackupFileList: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetBackupFileListTool', () => {
        it('should register the tool', () => {
            registerGetBackupFileListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getBackupFileList', expect.any(Object), expect.any(Function));
        });

        it('should call getBackupFileList', async () => {
            const mockData = { id: 'backup-1' };
            (mockClient.getBackupFileList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetBackupFileListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getBackupFileList).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getBackupFileList as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetBackupFileListTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
