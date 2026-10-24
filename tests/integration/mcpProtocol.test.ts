import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseToolCategories } from '../../src/config.js';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import type { CatalogOptions } from '../../src/server/catalog.js';
import { createServer } from '../../src/server/common.js';
import { registerAllTools } from '../../src/tools/index.js';

const connections: { client: Client; close: () => Promise<void> }[] = [];

afterEach(async () => {
    for (const connection of connections.splice(0)) await connection.close();
});

async function connect(categories: string, controller: object = {}, options: CatalogOptions = {}): Promise<Client> {
    const server = createServer();
    registerAllTools(server, controller as OmadaClient, parseToolCategories(categories).categories, options);
    const client = new Client({ name: 'in-memory-protocol-test', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    connections.push({
        client,
        close: async () => {
            await client.close();
            await server.close();
        },
    });
    return client;
}

function payload(result: Awaited<ReturnType<Client['callTool']>>): Record<string, unknown> {
    const typed = result as CallToolResult;
    const text = typed.content[0];
    expect(text.type).toBe('text');
    if (text.type !== 'text') throw new Error('Expected a JSON text result');
    const parsed = JSON.parse(text.text) as Record<string, unknown>;
    if (typed.structuredContent) expect(typed.structuredContent).toEqual(parsed);
    return parsed;
}

async function expectToolError(client: Client, name: string, args: Record<string, unknown>, message: RegExp): Promise<void> {
    const result = await client.callTool({ name, arguments: args });
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result)).toMatch(message);
}

describe('MCP protocol over in-memory transports', () => {
    it('negotiates resources and advertises the actual default mutation schema', async () => {
        const client = await connect('clients:rw');
        expect(client.getServerVersion()?.name).toBe('safe-omada-mcp');
        expect(await client.listResources()).toEqual({ resources: [] });
        const { tools } = await client.listTools();
        const block = tools.find((tool) => tool.name === 'blockClient');
        expect(block?.inputSchema.properties?.dryRun).toMatchObject({ type: 'boolean', default: true });
        expect(block?.inputSchema.required).toContain('clientMac');
        expect(block?.inputSchema.required).not.toContain('dryRun');
        expect(block?.inputSchema.properties).not.toHaveProperty('customHeaders');
        expect(block?.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: true });
        expect(tools.map((tool) => tool.name)).toEqual(expect.arrayContaining(['searchOperations', 'describeOperation', 'getServerCapabilities']));
    });

    it.each(['standard', 'compact'] as const)('previews omitted dryRun and applies only literal false in %s mode', async (catalogMode) => {
        const blockClient = vi.fn().mockResolvedValue({ accepted: true });
        const client = await connect('clients:rw', { blockClient }, { catalogMode });
        const call = (args: Record<string, unknown>) =>
            client.callTool(
                catalogMode === 'compact'
                    ? { name: 'callOperation', arguments: { name: 'blockClient', arguments: args } }
                    : { name: 'blockClient', arguments: args }
            );
        const preview = payload(await call({ clientMac: 'AA:BB:CC:DD:EE:FF' }));
        expect(preview).toMatchObject({ action: 'block-client', target: 'AA:BB:CC:DD:EE:FF', mode: 'dry-run', status: 'planned' });
        expect(blockClient).not.toHaveBeenCalled();
        for (const invalid of [
            { clientMac: 'invalid', dryRun: false },
            { clientMac: 'AA:BB:CC:DD:EE:FF', dryRun: 'false' },
        ]) {
            expect((await call(invalid)).isError).toBe(true);
        }
        expect(blockClient).not.toHaveBeenCalled();
        expect(payload(await call({ clientMac: 'AA:BB:CC:DD:EE:FF', dryRun: false, siteId: 'site-1' }))).toMatchObject({
            mode: 'apply',
            status: 'submitted',
            result: { accepted: true },
        });
        expect(blockClient).toHaveBeenCalledExactlyOnceWith('AA:BB:CC:DD:EE:FF', 'site-1', undefined);
    });

    it('compact dispatch cannot bypass categories, deprecated visibility, schema validation, or header policy', async () => {
        const getClientDetail = vi.fn().mockResolvedValue({ mac: 'AA:BB:CC:DD:EE:FF' });
        const client = await connect('clients:r,devices-ap:r', { getClientDetail }, { catalogMode: 'compact' });
        expect((await client.listTools()).tools.map((tool) => tool.name).sort()).toEqual([
            'callOperation',
            'describeOperation',
            'getServerCapabilities',
            'searchOperations',
        ]);
        for (const name of ['blockClient', 'restoreController', 'getRFScanResult', 'https://controller.invalid/delete']) {
            await expectToolError(client, 'callOperation', { name, arguments: { dryRun: false } }, /unavailable/);
            await expectToolError(client, 'describeOperation', { name }, /unavailable/);
        }
        await expectToolError(
            client,
            'callOperation',
            { name: 'getClientDetail', arguments: { clientMac: 'client-1', customHeaders: { Authorization: 'Bearer secret' } } },
            /customHeaders/
        );
        await expectToolError(
            client,
            'callOperation',
            { name: 'getClientDetail', arguments: { clientMac: 'client-1', url: '/raw/path', method: 'DELETE' } },
            /url|method/
        );
        await expectToolError(client, 'callOperation', { name: 'getClientDetail', arguments: {} }, /clientMac/);
        expect(getClientDetail).not.toHaveBeenCalled();
        const search = payload(await client.callTool({ name: 'searchOperations', arguments: { query: 'restore' } }));
        expect(search).toMatchObject({ totalMatches: 0, operations: [] });
        expect(payload(await client.callTool({ name: 'getServerCapabilities' }))).toMatchObject({
            writes: 0,
            recoveryEnabled: false,
            deprecatedIncluded: false,
            toolHeadersEnabled: false,
        });
        const described = payload(await client.callTool({ name: 'describeOperation', arguments: { name: 'getClientDetail' } }));
        expect(described).toMatchObject({ name: 'getClientDetail', permission: 'read', inputSchema: { additionalProperties: false } });
    });

    it('requires recovery category and both explicit apply and boolean acknowledgment', async () => {
        const restoreController = vi.fn().mockResolvedValue(null);
        const excluded = await connect('all:rw,maintenance:rw', { restoreController }, { catalogMode: 'compact' });
        await expectToolError(
            excluded,
            'callOperation',
            { name: 'restoreController', arguments: { fileName: 'backup.cfg', dryRun: false, confirmDangerous: true } },
            /unavailable/
        );
        const client = await connect('recovery:rw', { restoreController });
        expect(
            payload(await client.callTool({ name: 'restoreController', arguments: { fileName: 'backup.cfg', confirmDangerous: true } }))
        ).toMatchObject({ mode: 'dry-run', status: 'planned' });
        expect(payload(await client.callTool({ name: 'restoreController', arguments: { fileName: 'backup.cfg', dryRun: false } }))).toMatchObject({
            confirmationRequired: true,
        });
        await expectToolError(client, 'restoreController', { fileName: 'backup.cfg', dryRun: false, confirmDangerous: 'true' }, /confirmDangerous/);
        expect(restoreController).not.toHaveBeenCalled();
        expect(
            payload(
                await client.callTool({ name: 'restoreController', arguments: { fileName: 'backup.cfg', dryRun: false, confirmDangerous: true } })
            )
        ).toMatchObject({ mode: 'apply', status: 'submitted' });
        expect(restoreController).toHaveBeenCalledExactlyOnceWith('backup.cfg', undefined);
    });

    it.each(['standard', 'compact'] as const)('redacts nested secrets from both output channels in %s mode', async (catalogMode) => {
        const source = {
            siteId: 'site-1',
            password: 'recognizable-password-secret',
            nested: [{ token: 'recognizable-token-secret', privateKey: 'key-material', psk: 'wireless-psk', pin: 1234 }],
            enabled: true,
        };
        const getSiteDeviceAccount = vi.fn().mockResolvedValue(source);
        const client = await connect('sites:r', { getSiteDeviceAccount }, { catalogMode });
        const result = await client.callTool(
            catalogMode === 'compact'
                ? { name: 'callOperation', arguments: { name: 'getSiteDeviceAccount', arguments: { siteId: 'site-1' } } }
                : { name: 'getSiteDeviceAccount', arguments: { siteId: 'site-1' } }
        );
        expect(result.isError).not.toBe(true);
        expect(payload(result)).toEqual({
            siteId: 'site-1',
            password: '********',
            nested: [{ token: '********', privateKey: '********', psk: '********', pin: '********' }],
            enabled: true,
        });
        for (const secret of ['recognizable-password-secret', 'recognizable-token-secret', 'key-material', 'wireless-psk', '1234'])
            expect(JSON.stringify(result)).not.toContain(secret);
        expect(source.password).toBe('recognizable-password-secret');
        expect(getSiteDeviceAccount).toHaveBeenCalledExactlyOnceWith('site-1', undefined);
    });

    it('exposes deprecated operations only when explicitly enabled', async () => {
        const getRFScanResult = vi.fn().mockResolvedValue({ channels: [] });
        const client = await connect('devices-ap:r', { getRFScanResult }, { catalogMode: 'compact', includeDeprecated: true });
        expect(payload(await client.callTool({ name: 'describeOperation', arguments: { name: 'getRFScanResult' } }))).toMatchObject({
            name: 'getRFScanResult',
            deprecated: true,
        });
        expect(
            payload(
                await client.callTool({ name: 'callOperation', arguments: { name: 'getRFScanResult', arguments: { apMac: 'AA:BB:CC:DD:EE:FF' } } })
            )
        ).toEqual({ channels: [] });
        expect(getRFScanResult).toHaveBeenCalledExactlyOnceWith('AA:BB:CC:DD:EE:FF', undefined, undefined);
    });

    it.each(['standard', 'compact'] as const)('limits opted-in headers to correlation identifiers in %s mode', async (catalogMode) => {
        const getClientDetail = vi.fn().mockResolvedValue({ mac: 'AA:BB:CC:DD:EE:FF' });
        const client = await connect('clients:r', { getClientDetail }, { catalogMode, allowToolHeaders: true });
        const call = (customHeaders: Record<string, string>) =>
            client.callTool(
                catalogMode === 'compact'
                    ? { name: 'callOperation', arguments: { name: 'getClientDetail', arguments: { clientMac: 'client-1', customHeaders } } }
                    : { name: 'getClientDetail', arguments: { clientMac: 'client-1', customHeaders } }
            );
        for (const name of ['Authorization', 'authorization', 'Cookie', 'Host', 'X-Forwarded-For', 'X-Custom']) {
            expect((await call({ [name]: 'untrusted-value' })).isError).toBe(true);
        }
        expect(getClientDetail).not.toHaveBeenCalled();
        const allowed = { 'x-request-id': 'request-1', 'x-correlation-id': 'correlation-1' };
        expect((await call(allowed)).isError).not.toBe(true);
        expect(getClientDetail).toHaveBeenCalledExactlyOnceWith('client-1', undefined, allowed);
    });
});
