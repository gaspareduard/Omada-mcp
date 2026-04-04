import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDiagnoseClientTool } from '../../src/tools/diagnoseClient.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/diagnoseClient', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((_name, _schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;

        mockClient = {
            getClient: vi.fn(),
            getClientDetail: vi.fn(),
            listClientsPastConnections: vi.fn(),
        } as unknown as OmadaClient;

        vi.spyOn(loggerModule.logger, 'info').mockImplementation(() => {
            // noop
        });
        vi.spyOn(loggerModule.logger, 'error').mockImplementation(() => {
            // noop
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should register the diagnoseClient tool', () => {
        registerDiagnoseClientTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('diagnoseClient', expect.any(Object), expect.any(Function));
    });

    it('should resolve MAC from getClient result and call getClientDetail', async () => {
        const clientInfo = { mac: 'AA:BB:CC:DD:EE:FF', ip: '192.168.1.50', connected: true };
        const detail = { mac: 'AA:BB:CC:DD:EE:FF', vlan: 1, signalLevel: -55 };
        const history = [{ timestamp: 1700000000 }];

        vi.mocked(mockClient.getClient).mockResolvedValue(clientInfo as never);
        vi.mocked(mockClient.getClientDetail).mockResolvedValue(detail);
        vi.mocked(mockClient.listClientsPastConnections).mockResolvedValue(history as never);

        registerDiagnoseClientTool(mockServer, mockClient);
        const result = (await toolHandler({ identifier: '192.168.1.50' }, { sessionId: 'test' })) as { content: { text: string }[] };
        const parsed = JSON.parse(result.content[0].text);

        expect(mockClient.getClient).toHaveBeenCalledWith('192.168.1.50', undefined, undefined);
        expect(mockClient.getClientDetail).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', undefined, undefined);
        expect(parsed.currentStatus).toEqual(clientInfo);
        expect(parsed.detail).toEqual(detail);
        expect(parsed.recentConnectionHistory).toEqual(history);
        expect(parsed._resolvedMac).toBe('AA:BB:CC:DD:EE:FF');
    });

    it('should use identifier directly if it is a MAC and getClient returns undefined', async () => {
        vi.mocked(mockClient.getClient).mockResolvedValue(undefined);
        vi.mocked(mockClient.getClientDetail).mockResolvedValue({ mac: 'AA:BB:CC:DD:EE:FF' });
        vi.mocked(mockClient.listClientsPastConnections).mockResolvedValue([]);

        registerDiagnoseClientTool(mockServer, mockClient);
        await toolHandler({ identifier: 'AA:BB:CC:DD:EE:FF' }, { sessionId: 'test' });

        // MAC passed directly as identifier should still call getClientDetail
        expect(mockClient.getClientDetail).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', undefined, undefined);
    });

    it('should skip getClientDetail when identifier is non-MAC and getClient returns undefined', async () => {
        vi.mocked(mockClient.getClient).mockResolvedValue(undefined);
        vi.mocked(mockClient.listClientsPastConnections).mockResolvedValue([]);

        registerDiagnoseClientTool(mockServer, mockClient);
        const result = (await toolHandler({ identifier: 'unknown-hostname' }, { sessionId: 'test' })) as { content: { text: string }[] };
        const parsed = JSON.parse(result.content[0].text);

        expect(mockClient.getClientDetail).not.toHaveBeenCalled();
        expect(parsed.currentStatus).toBeNull();
        expect(parsed._resolvedMac).toBeNull();
        expect(parsed.detail).toBeNull();
    });

    it('should pass siteId correctly to all calls', async () => {
        vi.mocked(mockClient.getClient).mockResolvedValue({ mac: 'AA:BB:CC:DD:EE:FF' } as never);
        vi.mocked(mockClient.getClientDetail).mockResolvedValue({});
        vi.mocked(mockClient.listClientsPastConnections).mockResolvedValue([]);

        registerDiagnoseClientTool(mockServer, mockClient);
        await toolHandler({ identifier: 'AA:BB:CC:DD:EE:FF', siteId: 'site-1' }, { sessionId: 'test' });

        expect(mockClient.getClient).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 'site-1', undefined);
        expect(mockClient.getClientDetail).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 'site-1', undefined);
        expect(mockClient.listClientsPastConnections).toHaveBeenCalledWith(
            expect.objectContaining({ siteId: 'site-1', searchKey: 'AA:BB:CC:DD:EE:FF' }),
            undefined
        );
    });

    it('should gracefully degrade when getClientDetail fails', async () => {
        vi.mocked(mockClient.getClient).mockResolvedValue({ mac: 'AA:BB:CC:DD:EE:FF' } as never);
        vi.mocked(mockClient.getClientDetail).mockRejectedValue(new Error('detail unavailable'));
        vi.mocked(mockClient.listClientsPastConnections).mockResolvedValue([]);

        registerDiagnoseClientTool(mockServer, mockClient);
        const result = (await toolHandler({ identifier: 'AA:BB:CC:DD:EE:FF' }, { sessionId: 'test' })) as { content: { text: string }[] };
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.detail).toMatchObject({ _error: expect.stringContaining('detail unavailable') });
        expect(parsed.recentConnectionHistory).toEqual([]);
    });

    it('should throw when getClient itself fails (non-graceful error)', async () => {
        vi.mocked(mockClient.getClient).mockRejectedValue(new Error('auth failure'));

        registerDiagnoseClientTool(mockServer, mockClient);
        await expect(toolHandler({ identifier: '192.168.1.1' }, { sessionId: 'test' })).rejects.toThrow('auth failure');
    });
});
