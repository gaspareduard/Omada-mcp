import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ToolCategory, ToolPermission } from '../../src/config.js';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import * as commonModule from '../../src/server/common.js';
import { startStdioServer } from '../../src/server/stdio.js';
import * as loggerModule from '../../src/utils/logger.js';

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
    StdioServerTransport: vi.fn(),
}));

vi.mock('../../src/tools/index.js', () => ({
    registerAllTools: vi.fn(),
}));

describe('server/stdio', () => {
    let mockClient: OmadaClient;
    let mockServer: { connect: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        mockClient = {} as OmadaClient;

        mockServer = {
            connect: vi.fn().mockResolvedValue(undefined),
        };

        vi.spyOn(commonModule, 'createServer').mockReturnValue(mockServer as never);
        vi.spyOn(loggerModule.logger, 'info').mockImplementation(() => {
            // Mock implementation
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('startStdioServer', () => {
        it('should create server and connect transport', async () => {
            await startStdioServer(mockClient);

            expect(commonModule.createServer).toHaveBeenCalledWith();
            expect(StdioServerTransport).toHaveBeenCalled();
            expect(mockServer.connect).toHaveBeenCalled();
        });

        it('should log startup messages', async () => {
            await startStdioServer(mockClient);

            expect(loggerModule.logger.info).toHaveBeenCalledWith('Starting stdio server');
            expect(loggerModule.logger.info).toHaveBeenCalledWith('Connecting stdio server');
            expect(loggerModule.logger.info).toHaveBeenCalledWith('Stdio server connected');
        });

        it('should propagate connection errors', async () => {
            const error = new Error('Connection failed');
            mockServer.connect.mockRejectedValue(error);

            await expect(startStdioServer(mockClient)).rejects.toThrow('Connection failed');
        });

        it('should pass activeCategories to registerAllTools', async () => {
            const { registerAllTools } = await import('../../src/tools/index.js');
            const activeCategories = new Map<ToolCategory, Set<ToolPermission>>([['dashboard' as ToolCategory, new Set<ToolPermission>(['read'])]]);
            await startStdioServer(mockClient, activeCategories);
            expect(registerAllTools).toHaveBeenCalledWith(mockServer, mockClient, activeCategories);
        });
    });
});
