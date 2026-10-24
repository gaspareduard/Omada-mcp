import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type SwitchPortChange, SwitchPortOperations } from '../../src/omadaClient/switchPorts.js';

const spec = JSON.parse(readFileSync(new URL('../../docs/openapi/03-device.json', import.meta.url), 'utf8'));
const mac = 'AA:BB:CC:DD:EE:FF';
const prefix = '/openapi/v1/{omadacId}/sites/{siteId}/switches/{switchMac}';

describe('omadaClient/switchPorts', () => {
    const request = { request: vi.fn(), ensureSuccess: vi.fn((value) => value.result) };
    const site = { resolveSiteId: vi.fn(async (id?: string) => id ?? 'default-site') };
    const buildPath = vi.fn((path: string) => `/api${path}`);
    let operations: SwitchPortOperations;

    beforeEach(() => {
        vi.clearAllMocks();
        request.request.mockResolvedValue({ errorCode: 0 });
        operations = new SwitchPortOperations(request as never, site as never, buildPath);
    });

    const cases: { change: SwitchPortChange; schema: string; multiSchema?: string; payload: Record<string, unknown> }[] = [
        { change: { operation: 'name', name: 'Camera 01' }, schema: 'SwitchPortName', multiSchema: 'PortNameList', payload: { name: 'Camera 01' } },
        { change: { operation: 'status', status: 0 }, schema: 'SwitchPortStatus', multiSchema: 'SwitchPortsStatus', payload: { status: 0 } },
        { change: { operation: 'poe-mode', poeMode: 1 }, schema: 'SwitchPortPoe', multiSchema: 'SwitchPortsPoe', payload: { poeMode: 1 } },
        { change: { operation: 'profile', profileId: 'profile-1' }, schema: 'SwitchProfileID', payload: { profileId: 'profile-1' } },
        {
            change: { operation: 'profile-override', profileOverrideEnable: false },
            schema: 'ProfileOverride',
            multiSchema: 'BatchProfileOverride',
            payload: { profileOverrideEnable: false },
        },
    ];

    for (const { change, schema, multiSchema, payload } of cases) {
        it(`uses the documented single ${change.operation} PUT schema and disables retries`, async () => {
            const endpoint = `${prefix}/ports/{port}/${change.operation}`;
            expect(spec.paths[endpoint].put.requestBody.content['application/json'].schema.$ref).toBe(`#/components/schemas/${schema}`);
            expect(Object.keys(payload).sort()).toEqual([...spec.components.schemas[schema].required].sort());
            const headers = { 'X-Trace': 'test' };
            await expect(operations.setSwitchPorts(mac, [7], change, 'site/1', headers)).resolves.toBeUndefined();
            expect(request.request).toHaveBeenCalledExactlyOnceWith(
                { method: 'PUT', url: `/api/sites/site%2F1/switches/AA%3ABB%3ACC%3ADD%3AEE%3AFF/ports/7/${change.operation}`, data: payload },
                false,
                headers
            );
            expect(request.ensureSuccess).toHaveBeenCalledWith({ errorCode: 0 });
        });

        if (multiSchema) {
            it(`uses the documented multi-port ${change.operation} body`, async () => {
                const endpoint = `${prefix}/multi-ports/${change.operation}`;
                expect(spec.paths[endpoint].put.requestBody.content['application/json'].schema.$ref).toBe(`#/components/schemas/${multiSchema}`);
                const body =
                    change.operation === 'name'
                        ? {
                              portNameList: [
                                  { port: 1, ...payload },
                                  { port: 9, ...payload },
                              ],
                          }
                        : { portList: [1, 9], ...payload };
                expect(Object.keys(body).sort()).toEqual([...spec.components.schemas[multiSchema].required].sort());
                await operations.setSwitchPorts(mac, [1, 9], change);
                expect(site.resolveSiteId).toHaveBeenCalledWith(undefined);
                expect(request.request).toHaveBeenCalledExactlyOnceWith(
                    {
                        method: 'PUT',
                        url: `/api/sites/default-site/switches/AA%3ABB%3ACC%3ADD%3AEE%3AFF/multi-ports/${change.operation}`,
                        data: body,
                    },
                    false,
                    undefined
                );
            });
        }
    }

    it.each(
        [[], [0], [-1], [1.5], [2147483648], [1, 1], Array.from({ length: 33 }, (_, i) => i + 1), ['*']].map((ports) => [ports])
    )('rejects invalid explicit port list %j without requests', async (ports) => {
        await expect(operations.setSwitchPorts(mac, ports as number[], { operation: 'status', status: 1 })).rejects.toThrow();
        expect(site.resolveSiteId).not.toHaveBeenCalled();
        expect(request.request).not.toHaveBeenCalled();
    });

    it('rejects an invented multi-port profile assignment and invalid MAC', async () => {
        expect(spec.paths[`${prefix}/multi-ports/profile`]).toBeUndefined();
        await expect(operations.setSwitchPorts(mac, [1, 2], { operation: 'profile', profileId: 'p' })).rejects.toThrow('single-port');
        await expect(operations.setSwitchPorts('*', [1], { operation: 'name', name: 'x' })).rejects.toThrow('MAC');
        expect(request.request).not.toHaveBeenCalled();
    });

    it.each(['', ' leading', 'trailing ', '?', 'a?b', 'a"b', 'x'.repeat(129)])('rejects a name outside the documented schema: %j', async (name) => {
        await expect(operations.setSwitchPorts(mac, [1], { operation: 'name', name })).rejects.toThrow();
        expect(request.request).not.toHaveBeenCalled();
    });

    it('preserves controller rejection and transport failures without retry', async () => {
        request.ensureSuccess.mockImplementationOnce(() => {
            throw new Error('Port does not exist (-39701)');
        });
        await expect(operations.setSwitchPorts(mac, [1], { operation: 'status', status: 1 })).rejects.toThrow('-39701');
        request.request.mockRejectedValueOnce(new Error('timeout'));
        await expect(operations.setSwitchPorts(mac, [1], { operation: 'status', status: 1 })).rejects.toThrow('timeout');
        expect(request.request).toHaveBeenCalledTimes(2);
    });
});
