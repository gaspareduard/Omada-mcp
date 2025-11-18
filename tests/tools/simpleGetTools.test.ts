import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetClientTool } from '../../src/tools/getClient.js';
import { registerGetFirewallSettingTool } from '../../src/tools/getFirewallSetting.js';
import { registerGetInternetInfoTool } from '../../src/tools/getInternetInfo.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools - simple get operations', () => {
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
            getClient: vi.fn(),
            getFirewallSetting: vi.fn(),
            getInternetInfo: vi.fn(),
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

    describe('getClient', () => {
        it('should execute successfully', async () => {
            const mockClientData = { mac: '00:11:22:33:44:55', name: 'Client 1' };
            (mockClient.getClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockClientData);

            registerGetClientTool(mockServer, mockClient as never);
            const result = await toolHandler({ clientId: '00:11:22:33:44:55' }, {});

            expect(result).toBeDefined();
        });
    });

    describe('getFirewallSetting', () => {
        it('should execute successfully', async () => {
            const mockFirewall = { enabled: true };
            (mockClient.getFirewallSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockFirewall);

            registerGetFirewallSettingTool(mockServer, mockClient);
            const result = await toolHandler({}, {});

            expect(result).toBeDefined();
        });
    });

    describe('getInternetInfo', () => {
        it('should execute successfully', async () => {
            const mockInfo = { status: 'connected' };
            (mockClient.getInternetInfo as ReturnType<typeof vi.fn>).mockResolvedValue(mockInfo);

            registerGetInternetInfoTool(mockServer, mockClient);
            const result = await toolHandler({}, {});

            expect(result).toBeDefined();
        });
    });
});
