import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { DeviceOperations } from '../../src/omadaClient/device.js';
import { type SwitchPortChange, SwitchPortOperations } from '../../src/omadaClient/switchPorts.js';
import type { ToolExtra } from '../../src/server/common.js';
import { registerSetSwitchPortsTool } from '../../src/tools/setSwitchPorts.js';

const mac = 'AA-BB-CC-DD-EE-FF';
const change = { operation: 'name', name: 'Camera' };
const port = (id: number, extra: Record<string, unknown> = {}) => ({
    port: id,
    name: `Port ${id}`,
    status: 1,
    poeMode: 1,
    profileId: 'old',
    profileName: 'LAN',
    profileOverrideEnable: false,
    lagPort: false,
    ...extra,
});
const detail = (...ports: unknown[]) => ({ mac, portList: ports });

describe('tools/setSwitchPorts', () => {
    const client = { getSwitchDetail: vi.fn(), setSwitchPorts: vi.fn() };
    let handler: (args: Record<string, unknown>, extra: ToolExtra) => Promise<CallToolResult>;
    let registration: { description: string; inputSchema: z.ZodRawShape; annotations: unknown };
    const server = {
        registerTool: vi.fn((_name, config, callback) => {
            registration = config;
            handler = callback;
        }),
    } as unknown as McpServer;

    async function call(args: Record<string, unknown> = {}) {
        const result = await handler({ switchMac: mac, ports: [1, 2], change, ...args }, { sessionId: 'unit-test' } as ToolExtra);
        const text = result.content[0];
        if (text.type !== 'text') throw new Error('Expected text content');
        return JSON.parse(text.text);
    }

    beforeEach(() => {
        vi.resetAllMocks();
        client.getSwitchDetail.mockResolvedValue(detail(port(1), port(2)));
        client.setSwitchPorts.mockResolvedValue(undefined);
        registerSetSwitchPortsTool(server, client);
    });

    it('registers write metadata and previews by default with all target diffs and unknown topology', async () => {
        expect(server.registerTool).toHaveBeenCalledWith('setSwitchPorts', expect.any(Object), expect.any(Function));
        expect(registration.annotations).toEqual({ destructiveHint: true, readOnlyHint: false, idempotentHint: false });
        const defaults = z.object(registration.inputSchema).parse({ switchMac: mac, ports: [1], change });
        expect(defaults).toMatchObject({ dryRun: true, allowDisruption: false });
        const summary = await call();
        expect(summary).toMatchObject({ mode: 'dry-run', status: 'planned' });
        expect(summary.result).toMatchObject({ dryRun: true, canApply: true, verification: { status: 'planned', attempts: 0 } });
        expect(summary.result.outcomes[0]).toMatchObject({
            port: 1,
            diff: { field: 'name', before: 'Port 1', requested: 'Camera' },
            risk: { lag: false, uplink: 'unknown', trunk: 'unknown', stack: 'unknown' },
        });
        expect(client.setSwitchPorts).not.toHaveBeenCalled();
        expect(client.getSwitchDetail).toHaveBeenCalledTimes(1);
    });

    it.each([
        { ports: [] },
        { ports: ['*'] },
        { ports: [1, 1] },
        { ports: [0] },
        { ports: [1.5] },
        { ports: Array.from({ length: 33 }, (_, i) => i + 1) },
        { switchMac: '*' },
        { change: { operation: 'status', status: 2 } },
        { change: { operation: 'poe-mode', poeMode: 2 } },
        { change: { operation: 'profile', profileId: '' } },
        { change: { operation: 'profile-override', profileId: 'p', profileOverrideEnable: true } },
        { change: { operation: 'name', name: 'a?b' } },
        { change: { operation: 'name', name: ' leading' } },
    ])('rejects invalid target or payload before any reads: %j', async (args) => {
        await expect(call(args)).rejects.toThrow();
        expect(client.getSwitchDetail).not.toHaveBeenCalled();
        expect(client.setSwitchPorts).not.toHaveBeenCalled();
    });

    it.each([
        null,
        {},
        { ports: [port(1)] },
        { portList: [{ port: '1' }] },
        detail(port(1), port(1)),
        { mac: '11-22-33-44-55-66', portList: [port(1)] },
    ])('rejects unsupported or ambiguous preflight detail: %j', async (response) => {
        client.getSwitchDetail.mockResolvedValue(response);
        await expect(call({ dryRun: false })).rejects.toThrow();
        expect(client.setSwitchPorts).not.toHaveBeenCalled();
    });

    it('validates every target before writes and propagates preflight read failures', async () => {
        await expect(call({ ports: [1, 999], dryRun: false })).rejects.toThrow('Port 999');
        client.getSwitchDetail.mockRejectedValueOnce(new Error('Forbidden'));
        await expect(call({ dryRun: false })).rejects.toThrow('Forbidden');
        expect(client.setSwitchPorts).not.toHaveBeenCalled();
    });

    it('shows blocked LAG ports in preview and rejects disruption before writes', async () => {
        client.getSwitchDetail.mockResolvedValue(detail(port(1, { lagPort: true }), port(2)));
        const args = { change: { operation: 'poe-mode', poeMode: 0 } };
        expect((await call(args)).result).toMatchObject({ blockedPorts: [1], canApply: false });
        await expect(call({ ...args, dryRun: false })).rejects.toThrow('allowDisruption');
        expect(client.setSwitchPorts).not.toHaveBeenCalled();
    });

    it.each<SwitchPortChange>([
        { operation: 'status', status: 0 },
        { operation: 'status', status: 1 },
        { operation: 'poe-mode', poeMode: 1 },
        { operation: 'profile', profileId: 'new' },
        { operation: 'profile-override', profileOverrideEnable: true },
    ])('guards known LAG disruption for %j', async (change) => {
        client.getSwitchDetail.mockResolvedValue(detail(port(1, { lagPort: true, poeMode: 0 })));
        await expect(call({ ports: [1], change, dryRun: false })).rejects.toThrow('allowDisruption');
        expect(client.setSwitchPorts).not.toHaveBeenCalled();
    });

    it.each([false, undefined])('blocks PoE changes without a confirmed profile override (%s)', async (profileOverrideEnable) => {
        client.getSwitchDetail.mockResolvedValue(detail(port(1, { poeMode: 0, profileOverrideEnable })));
        const args = { ports: [1], change: { operation: 'poe-mode', poeMode: 1 }, allowDisruption: true };
        expect((await call(args)).result).toMatchObject({ canApply: false, prerequisiteBlockedPorts: [1] });
        await expect(call({ ...args, dryRun: false })).rejects.toThrow('profile override');
        expect(client.setSwitchPorts).not.toHaveBeenCalled();
    });

    it('applies PoE only after profile override is confirmed and skips already matching ports', async () => {
        client.getSwitchDetail
            .mockResolvedValueOnce(detail(port(1, { poeMode: 0, profileOverrideEnable: true }), port(2)))
            .mockResolvedValue(detail(port(1, { poeMode: 1, profileOverrideEnable: true }), port(2)));
        const result = (await call({ change: { operation: 'poe-mode', poeMode: 1 }, dryRun: false })).result;
        expect(client.setSwitchPorts).toHaveBeenCalledExactlyOnceWith(mac, [1], { operation: 'poe-mode', poeMode: 1 }, undefined, undefined);
        expect(result.verification.status).toBe('verified');
    });

    it('allows a LAG name change but never invents topology from a port name or arbitrary flags', async () => {
        client.getSwitchDetail
            .mockResolvedValueOnce(detail(port(1, { lagPort: true, uplink: true, trunk: true })))
            .mockResolvedValue(detail(port(1, { lagPort: true, name: 'Camera' })));
        const result = (await call({ ports: [1], dryRun: false })).result;
        expect(result.verification.status).toBe('verified');
        expect(result.outcomes[0].risk).toEqual({ lag: true, uplink: 'unknown', trunk: 'unknown', stack: 'unknown' });
    });

    it('allows explicitly acknowledged LAG changes but cannot verify the undefined status field', async () => {
        client.getSwitchDetail.mockResolvedValue(detail(port(1, { lagPort: true, status: 0 })));
        const result = (await call({ ports: [1], change: { operation: 'status', status: 0 }, dryRun: false, allowDisruption: true })).result;
        expect(client.setSwitchPorts).toHaveBeenCalledTimes(1);
        expect(result).toMatchObject({ verification: { status: 'unknown', attempts: 3 } });
        expect(result.outcomes[0].diff.before).toBeNull();
    });

    it('forwards site and headers, batches explicit targets, and verifies readback', async () => {
        client.getSwitchDetail
            .mockResolvedValueOnce(detail(port(1), port(2)))
            .mockResolvedValue(detail(port(1, { name: 'Camera' }), port(2, { name: 'Camera' })));
        const headers = { 'X-Trace': 'test' };
        const result = (await call({ dryRun: false, siteId: 'site-1', customHeaders: headers })).result;
        expect(client.setSwitchPorts).toHaveBeenCalledExactlyOnceWith(mac, [1, 2], change, 'site-1', headers);
        expect(client.getSwitchDetail).toHaveBeenLastCalledWith(mac, 'site-1', headers);
        expect(result).toMatchObject({
            completion: 'complete',
            partialCompletion: false,
            verification: { status: 'verified', attempts: 1, verified: 2 },
        });
    });

    it('reports partial application after bounded readback without retrying writes', async () => {
        client.getSwitchDetail.mockResolvedValueOnce(detail(port(1), port(2))).mockResolvedValue(detail(port(1, { name: 'Camera' }), port(2)));
        const result = (await call({ dryRun: false })).result;
        expect(result).toMatchObject({
            completion: 'partial',
            partialCompletion: true,
            verification: { status: 'partial', attempts: 3, verified: 1, total: 2 },
        });
        expect(result.outcomes.map((o: { verification: string }) => o.verification)).toEqual(['verified', 'mismatch']);
        expect(client.getSwitchDetail).toHaveBeenCalledTimes(4);
        expect(client.setSwitchPorts).toHaveBeenCalledTimes(1);
    });

    it('verifies delayed convergence within the fixed three-read budget', async () => {
        client.getSwitchDetail
            .mockResolvedValueOnce(detail(port(1)))
            .mockResolvedValueOnce(detail(port(1)))
            .mockResolvedValue(detail(port(1, { name: 'Camera' })));
        expect((await call({ ports: [1], dryRun: false })).result.verification).toMatchObject({ status: 'verified', attempts: 2 });
        expect(client.setSwitchPorts).toHaveBeenCalledTimes(1);
    });

    it('reports unchanged wrong state as mismatch', async () => {
        const result = (await call({ dryRun: false })).result;
        expect(result).toMatchObject({ completion: 'unconfirmed', verification: { status: 'mismatch', attempts: 3, verified: 0 } });
    });

    it.each([
        detail(port(1, { name: 'Camera' })),
        detail(port(1, { name: 'Camera' }), port(2, { name: undefined })),
        detail(port(1, { name: 'Camera' }), port(2, { name: 8 })),
    ])('makes absent ports and missing or invalid fields explicit: %j', async (after) => {
        client.getSwitchDetail.mockResolvedValueOnce(detail(port(1), port(2))).mockResolvedValue(after);
        const result = (await call({ dryRun: false })).result;
        expect(result.verification.status).toBe('partial');
        expect(result.outcomes[1]).toMatchObject({ verification: 'unknown', readbackIssue: expect.stringContaining('absent') });
    });

    it('returns unknown when support is absent and does not turn undefined into false or zero', async () => {
        client.getSwitchDetail.mockResolvedValue(detail({ port: 1, lagPort: 'false', profileOverrideEnable: true }));
        const result = (await call({ ports: [1], change: { operation: 'poe-mode', poeMode: 0 }, dryRun: false })).result;
        expect(result.outcomes[0]).toMatchObject({ diff: { before: null }, risk: { lag: 'unknown' }, verification: 'unknown' });
        expect(result.warnings).toContain('Current configuration is unavailable for one or more requested fields.');
    });

    it('retains request uncertainty even if readback confirms desired configuration', async () => {
        client.setSwitchPorts.mockRejectedValueOnce(new Error('timeout with secret'));
        client.getSwitchDetail
            .mockResolvedValueOnce(detail(port(1), port(2)))
            .mockResolvedValue(detail(port(1, { name: 'Camera' }), port(2, { name: 'Camera' })));
        const result = (await call({ dryRun: false })).result;
        expect(result.verification.status).toBe('verified');
        expect(result.outcomes[0]).toMatchObject({ requestStatus: 'unknown', requestError: expect.stringContaining('No retry') });
        expect(JSON.stringify(result)).not.toContain('secret');
        expect(client.setSwitchPorts).toHaveBeenCalledTimes(1);
    });

    it('stops sequential profile assignments after failure and reports all targets, including not attempted', async () => {
        client.getSwitchDetail
            .mockResolvedValueOnce(detail(port(1), port(2), port(3)))
            .mockResolvedValue(detail(port(1, { profileId: 'new' }), port(2), port(3)));
        client.setSwitchPorts.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('unsupported'));
        const result = (await call({ ports: [1, 2, 3], change: { operation: 'profile', profileId: 'new' }, dryRun: false })).result;
        expect(client.setSwitchPorts.mock.calls.map((args) => args[1])).toEqual([[1], [2]]);
        expect(result.outcomes.map((o: { requestStatus: string }) => o.requestStatus)).toEqual(['submitted', 'unknown', 'not-attempted']);
        expect(result.partialCompletion).toBe(true);
    });

    it('keeps profile override distinct from profile assignment', async () => {
        client.getSwitchDetail
            .mockResolvedValueOnce(detail(port(1), port(2)))
            .mockResolvedValue(detail(port(1, { profileOverrideEnable: true }), port(2, { profileOverrideEnable: true })));
        const change = { operation: 'profile-override', profileOverrideEnable: true };
        const result = (await call({ change, dryRun: false })).result;
        expect(client.setSwitchPorts).toHaveBeenCalledExactlyOnceWith(mac, [1, 2], change, undefined, undefined);
        expect(result.outcomes[0].diff.field).toBe('profileOverrideEnable');
        expect(result.verification.status).toBe('verified');
    });

    it('skips already matching targets while still reading after the workflow', async () => {
        const result = (await call({ change: { operation: 'status', status: 1 }, dryRun: false })).result;
        expect(client.setSwitchPorts).not.toHaveBeenCalled();
        expect(client.getSwitchDetail).toHaveBeenCalledTimes(2);
        expect(result.outcomes[0].requestStatus).toBe('not-needed');
        expect(result.verification.status).toBe('verified');
    });

    it('does not keep stale partial success when later readback fails', async () => {
        client.getSwitchDetail
            .mockResolvedValueOnce(detail(port(1), port(2)))
            .mockResolvedValueOnce(detail(port(1, { name: 'Camera' }), port(2)))
            .mockRejectedValue(new Error('offline'));
        const result = (await call({ dryRun: false })).result;
        expect(result.verification).toMatchObject({ status: 'unknown', attempts: 3, verified: 0 });
        expect(result.outcomes[0]).toMatchObject({ after: null, verification: 'unknown', readbackIssue: expect.stringContaining('failed') });
        expect(client.setSwitchPorts).toHaveBeenCalledTimes(1);
    });

    it('catches malformed readback without losing the submitted outcome', async () => {
        client.getSwitchDetail.mockResolvedValueOnce(detail(port(1), port(2))).mockResolvedValue({});
        const result = (await call({ dryRun: false })).result;
        expect(result.outcomes[0]).toMatchObject({ requestStatus: 'submitted', verification: 'unknown' });
    });

    it('runs handler through real operations with the documented switch detail and multi-name contracts', async () => {
        const request = {
            get: vi
                .fn()
                .mockResolvedValueOnce({ errorCode: 0, result: detail(port(1), port(2)) })
                .mockResolvedValue({ errorCode: 0, result: detail(port(1, { name: 'Camera' }), port(2, { name: 'Camera' })) }),
            request: vi.fn().mockResolvedValue({ errorCode: 0 }),
            ensureSuccess: vi.fn((value) => value.result),
        };
        const site = { resolveSiteId: vi.fn(async () => 'site-1') };
        const buildPath = (path: string) => `/openapi/v1/controller${path}`;
        const devices = new DeviceOperations(request as never, site as never, buildPath);
        const switches = new SwitchPortOperations(request as never, site as never, buildPath);
        registerSetSwitchPortsTool(server, {
            getSwitchDetail: devices.getSwitchDetail.bind(devices),
            setSwitchPorts: switches.setSwitchPorts.bind(switches),
        });
        const result = (await call({ dryRun: false, siteId: 'site-1' })).result;
        expect(request.get).toHaveBeenCalledTimes(2);
        expect(request.get).toHaveBeenLastCalledWith(`/openapi/v1/controller/sites/site-1/switches/${mac}`, undefined, undefined);
        expect(request.request).toHaveBeenCalledExactlyOnceWith(
            {
                method: 'PUT',
                url: `/openapi/v1/controller/sites/site-1/switches/${mac}/multi-ports/name`,
                data: {
                    portNameList: [
                        { port: 1, name: 'Camera' },
                        { port: 2, name: 'Camera' },
                    ],
                },
            },
            false,
            undefined
        );
        expect(result.verification.status).toBe('verified');
    });
});
