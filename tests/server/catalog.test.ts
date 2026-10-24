import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { type CatalogOptions, type CatalogTool, registerCatalog } from '../../src/server/catalog.js';
import type { ToolExtra } from '../../src/server/common.js';

function setup(options: CatalogOptions = {}, inputTools?: CatalogTool[]) {
    const read = vi.fn(async () => ({
        content: [{ type: 'text' as const, text: JSON.stringify({ password: 'never-display', mac: 'test-mac' }) }],
        structuredContent: { secret: 'hidden', value: 1 },
    }));
    const write = vi.fn(async (args: Record<string, unknown>) => ({ content: [{ type: 'text' as const, text: JSON.stringify(args) }] }));
    const tools: CatalogTool[] = inputTools ?? [
        {
            name: 'readDevice',
            description: 'Read an AP',
            category: 'devices-ap',
            permission: 'read',
            inputSchema: { id: z.string().min(1), customHeaders: z.record(z.string(), z.string()).optional() },
            handler: read,
        },
        {
            name: 'changeDevice',
            description: 'Change an AP',
            category: 'devices-ap',
            permission: 'write',
            inputSchema: { dryRun: z.boolean().default(true), id: z.string() },
            handler: write,
        },
        { name: 'oldRead', description: '[DEPRECATED] old alias', category: 'devices-ap', permission: 'read', inputSchema: {}, handler: read },
    ];
    const registered = new Map<
        string,
        { config: { inputSchema: z.ZodRawShape; annotations?: Record<string, unknown> }; handler: CatalogTool['handler'] }
    >();
    registerCatalog(
        {
            registerTool(name: string, config: { inputSchema: z.ZodRawShape }, handler: CatalogTool['handler']) {
                registered.set(name, { config, handler });
            },
        } as unknown as McpServer,
        tools,
        options
    );
    const raw = async (name: string, args: Record<string, unknown> = {}): Promise<CallToolResult> => {
        const tool = registered.get(name);
        if (!tool) throw new Error('missing registration');
        return await tool.handler(z.object(tool.config.inputSchema).parse(args), { sessionId: 'test' } as ToolExtra);
    };
    const call = async (name: string, args: Record<string, unknown> = {}): Promise<Record<string, unknown>> =>
        JSON.parse((await raw(name, args)).content[0].text as string);
    return { registered, raw, call, read, write };
}

describe('policy-aware tool catalog', () => {
    it('hides legacy aliases and transport headers and sets accurate annotations', () => {
        const { registered } = setup();
        expect(registered.has('oldRead')).toBe(false);
        expect(registered.get('readDevice')?.config.inputSchema.customHeaders).toBeUndefined();
        expect(registered.get('readDevice')?.config.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
        expect(registered.get('changeDevice')?.config.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: true });
    });
    it('retains explicit legacy/header options', async () => {
        const { registered, call } = setup({ includeDeprecated: true, allowToolHeaders: true, capabilityProfile: 'admin' });
        expect(registered.has('oldRead')).toBe(true);
        expect(registered.get('readDevice')?.config.inputSchema.customHeaders).toBeDefined();
        expect(await call('getServerCapabilities')).toMatchObject({
            profile: 'admin',
            deprecatedIncluded: true,
            toolHeadersEnabled: true,
            writes: 1,
            reads: 2,
        });
    });
    it('allows only bounded diagnostic IDs when tool headers are enabled', async () => {
        const { call, read } = setup({ allowToolHeaders: true, catalogMode: 'compact' });
        await call('callOperation', { name: 'readDevice', arguments: { id: 'ap', customHeaders: { 'X-Request-ID': 'trace-123' } } });
        expect(read).toHaveBeenCalledTimes(1);
        for (const customHeaders of [
            { Authorization: 'override' },
            { Host: 'elsewhere' },
            { 'X-Request-ID': 'bad\r\nvalue' },
            { 'X-Correlation-ID': 'x'.repeat(129) },
        ]) {
            await expect(call('callOperation', { name: 'readDevice', arguments: { id: 'ap', customHeaders } })).rejects.toThrow();
        }
        expect(read).toHaveBeenCalledTimes(1);
    });
    it('searches enabled descriptions/categories, limits output and describes exact schemas', async () => {
        const { call } = setup();
        expect(await call('searchOperations', { query: 'AP', limit: 1 })).toMatchObject({ totalMatches: 2, limited: true });
        expect(await call('searchOperations', { query: 'missing' })).toMatchObject({ totalMatches: 0 });
        expect(await call('describeOperation', { name: 'readDevice' })).toMatchObject({
            permission: 'read',
            inputSchema: { additionalProperties: false },
        });
        await expect(call('describeOperation', { name: 'oldRead' })).rejects.toThrow('unavailable');
    });
    it('compact dispatch preserves validation and preview defaults without exposing raw API paths', async () => {
        const { registered, call, write } = setup({ catalogMode: 'compact' });
        expect([...registered.keys()]).toEqual(['searchOperations', 'describeOperation', 'getServerCapabilities', 'callOperation']);
        expect(await call('callOperation', { name: 'changeDevice', arguments: { id: 'ap' } })).toEqual({ id: 'ap', dryRun: true });
        expect(write).toHaveBeenCalledTimes(1);
        await expect(call('callOperation', { name: 'changeDevice', arguments: { id: 'ap', url: '/raw' } })).rejects.toThrow();
        await expect(call('callOperation', { name: 'readDevice', arguments: {} })).rejects.toThrow();
        await expect(call('callOperation', { name: 'oldRead' })).rejects.toThrow('unavailable');
        await expect(call('callOperation', { name: '/openapi/raw' })).rejects.toThrow('unavailable');
    });
    it('never exposes writes absent from the active inventory, including through discovery', async () => {
        const read: CatalogTool = {
            name: 'read',
            description: 'Read',
            category: 'clients',
            permission: 'read',
            inputSchema: {},
            handler: async () => ({ content: [] }),
        };
        const { registered, call } = setup({ catalogMode: 'compact' }, [read]);
        expect(registered.get('callOperation')?.config.annotations?.readOnlyHint).toBe(true);
        expect(await call('getServerCapabilities')).toMatchObject({ writes: 0, recoveryEnabled: false });
        await expect(call('callOperation', { name: 'restoreController' })).rejects.toThrow('unavailable');
        expect(await call('searchOperations', { query: 'restore' })).toMatchObject({ totalMatches: 0 });
    });
    it('redacts secrets in text JSON and structured outputs', async () => {
        const { raw } = setup();
        const result = await raw('readDevice', { id: 'ap' });
        expect(JSON.stringify(result)).not.toContain('never-display');
        expect(result.structuredContent).toEqual({ secret: '********', value: 1 });
        expect(JSON.stringify(result)).toContain('test-mac');
    });
    it('handles textual and nontext output and reports explicit recovery capability', async () => {
        const handler = async (): Promise<CallToolResult> => ({
            content: [
                { type: 'text', text: 'plain response' },
                { type: 'image', data: 'encoded', mimeType: 'image/png' },
            ],
        });
        const { raw, call } = setup({}, [
            { name: 'restore', description: 'Restore', category: 'recovery', permission: 'write', inputSchema: {}, handler },
        ]);
        expect((await raw('restore')).content).toHaveLength(2);
        expect(await call('getServerCapabilities')).toMatchObject({ recoveryEnabled: true });
    });
});
