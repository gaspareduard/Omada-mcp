import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGatewayHealthTool } from '../../src/tools/getGatewayHealth.js';
import * as loggerModule from '../../src/utils/logger.js';

const GATEWAY_DEVICE = { mac: 'GW:MA:C0:00:00:01', type: 3, name: 'Gateway' };
const AP_DEVICE = { mac: 'AP:MA:C0:00:00:02', type: 1, name: 'AP' };

describe('tools/getGatewayHealth', () => {
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
            listDevices: vi.fn(),
            getGatewayDetail: vi.fn(),
            getGatewayWanStatus: vi.fn(),
            getGatewayLanStatus: vi.fn(),
            getGatewayPorts: vi.fn(),
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

    it('should register the getGatewayHealth tool', () => {
        registerGetGatewayHealthTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('getGatewayHealth', expect.any(Object), expect.any(Function));
    });

    it('should auto-discover gateway MAC and call all detail methods', async () => {
        const mockDetail = { cpu: 10, memory: 40 };
        const mockWan = { link: 'up', ip: '1.2.3.4' };
        const mockLan = { ip: '192.168.0.1' };
        const mockPorts = [{ id: 0, type: 'wan' }];

        vi.mocked(mockClient.listDevices).mockResolvedValue([AP_DEVICE, GATEWAY_DEVICE] as never);
        vi.mocked(mockClient.getGatewayDetail).mockResolvedValue(mockDetail);
        vi.mocked(mockClient.getGatewayWanStatus).mockResolvedValue(mockWan);
        vi.mocked(mockClient.getGatewayLanStatus).mockResolvedValue(mockLan);
        vi.mocked(mockClient.getGatewayPorts).mockResolvedValue(mockPorts as never);

        registerGetGatewayHealthTool(mockServer, mockClient);
        const result = (await toolHandler({}, { sessionId: 'test' })) as { content: { text: string }[] };
        const parsed = JSON.parse(result.content[0].text);

        expect(mockClient.listDevices).toHaveBeenCalledWith(undefined, undefined);
        expect(mockClient.getGatewayDetail).toHaveBeenCalledWith('GW:MA:C0:00:00:01', undefined, undefined);
        expect(parsed.gatewayMac).toBe('GW:MA:C0:00:00:01');
        expect(parsed.detail).toEqual(mockDetail);
        expect(parsed.wanStatus).toEqual(mockWan);
        expect(parsed.lanStatus).toEqual(mockLan);
        expect(parsed.ports).toEqual(mockPorts);
    });

    it('should skip listDevices when gatewayMac is provided explicitly', async () => {
        vi.mocked(mockClient.getGatewayDetail).mockResolvedValue({});
        vi.mocked(mockClient.getGatewayWanStatus).mockResolvedValue({});
        vi.mocked(mockClient.getGatewayLanStatus).mockResolvedValue({});
        vi.mocked(mockClient.getGatewayPorts).mockResolvedValue([]);

        registerGetGatewayHealthTool(mockServer, mockClient);
        await toolHandler({ gatewayMac: 'AA:BB:CC:DD:EE:FF' }, { sessionId: 'test' });

        expect(mockClient.listDevices).not.toHaveBeenCalled();
        expect(mockClient.getGatewayDetail).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', undefined, undefined);
    });

    it('should return error response when no gateway is found', async () => {
        vi.mocked(mockClient.listDevices).mockResolvedValue([AP_DEVICE] as never);

        registerGetGatewayHealthTool(mockServer, mockClient);
        const result = (await toolHandler({}, { sessionId: 'test' })) as { content: { text: string }[] };
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed._error).toMatch(/No gateway device found/);
        expect(mockClient.getGatewayDetail).not.toHaveBeenCalled();
    });

    it('should gracefully degrade when a detail call fails', async () => {
        vi.mocked(mockClient.listDevices).mockResolvedValue([GATEWAY_DEVICE] as never);
        vi.mocked(mockClient.getGatewayDetail).mockResolvedValue({ cpu: 5 });
        vi.mocked(mockClient.getGatewayWanStatus).mockRejectedValue(new Error('WAN endpoint unavailable'));
        vi.mocked(mockClient.getGatewayLanStatus).mockResolvedValue({ ip: '10.0.0.1' });
        vi.mocked(mockClient.getGatewayPorts).mockResolvedValue([]);

        registerGetGatewayHealthTool(mockServer, mockClient);
        const result = (await toolHandler({}, { sessionId: 'test' })) as { content: { text: string }[] };
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.detail).toEqual({ cpu: 5 });
        expect(parsed.wanStatus).toMatchObject({ _error: expect.stringContaining('WAN endpoint unavailable') });
        expect(parsed.lanStatus).toEqual({ ip: '10.0.0.1' });
    });

    it('should detect gateway by string type "gateway"', async () => {
        const stringTypeGateway = { mac: 'GW:ST:RN:00:00:01', type: 'gateway', name: 'GW' };
        vi.mocked(mockClient.listDevices).mockResolvedValue([stringTypeGateway] as never);
        vi.mocked(mockClient.getGatewayDetail).mockResolvedValue({});
        vi.mocked(mockClient.getGatewayWanStatus).mockResolvedValue({});
        vi.mocked(mockClient.getGatewayLanStatus).mockResolvedValue({});
        vi.mocked(mockClient.getGatewayPorts).mockResolvedValue([]);

        registerGetGatewayHealthTool(mockServer, mockClient);
        await toolHandler({}, { sessionId: 'test' });

        expect(mockClient.getGatewayDetail).toHaveBeenCalledWith('GW:ST:RN:00:00:01', undefined, undefined);
    });

    it('should pass siteId to all calls', async () => {
        vi.mocked(mockClient.listDevices).mockResolvedValue([GATEWAY_DEVICE] as never);
        vi.mocked(mockClient.getGatewayDetail).mockResolvedValue({});
        vi.mocked(mockClient.getGatewayWanStatus).mockResolvedValue({});
        vi.mocked(mockClient.getGatewayLanStatus).mockResolvedValue({});
        vi.mocked(mockClient.getGatewayPorts).mockResolvedValue([]);

        registerGetGatewayHealthTool(mockServer, mockClient);
        await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });

        expect(mockClient.listDevices).toHaveBeenCalledWith('site-1', undefined);
        expect(mockClient.getGatewayDetail).toHaveBeenCalledWith('GW:MA:C0:00:00:01', 'site-1', undefined);
    });
});
