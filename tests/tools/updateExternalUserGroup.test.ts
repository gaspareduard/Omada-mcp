import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { OmadaApiError } from '../../src/omadaClient/request.js';
import { registerUpdateExternalUserGroupTool } from '../../src/tools/updateExternalUserGroup.js';

type Handler = (
    args: Record<string, unknown>,
    extra: object
) => Promise<{ structuredContent?: Record<string, unknown>; content: { text: string }[] }>;

const payload = { name: 'ops', roleId: 'r1', allSite: false, sites: ['s2', 's1'] };

describe('tools/updateExternalUserGroup', () => {
    let groups: Record<string, unknown>[];
    let handler: Handler;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;

    beforeEach(() => {
        groups = [{ id: 'g1', name: 'ops', roleId: 'r1', roleName: 'Viewer', allSite: false, sites: [{ id: 's1', name: 'HQ' }] }];
        const toRead = (body: Record<string, unknown>) => ({
            ...body,
            sites: [...((body.sites as string[] | undefined) ?? [])].reverse().map((id) => ({ id, name: id.toUpperCase() })),
        });
        client = {
            listExternalUserGroups: vi.fn(async () => groups),
            createExternalUserGroup: vi.fn((body: Record<string, unknown>) => {
                groups = [...groups, { ...toRead(body), id: 'g2' }];
                return Promise.resolve({ id: 'g2' });
            }),
            updateExternalUserGroup: vi.fn((id: string, body: Record<string, unknown>) => {
                groups = groups.map((group) => (group.id === id ? { ...group, ...toRead(body) } : group));
                return Promise.resolve({});
            }),
            deleteExternalUserGroup: vi.fn((id: string) => {
                groups = groups.filter((group) => group.id !== id);
                return Promise.resolve({});
            }),
        };
        const server = {
            registerTool: vi.fn((_name, def, fn) => {
                definition = def;
                handler = fn;
            }),
        } as unknown as McpServer;
        registerUpdateExternalUserGroupTool(server, client as unknown as OmadaClient);
    });

    it('validates the id', () => {
        expect(() => definition.inputSchema.groupId.parse('')).toThrow();
    });

    it('previews the difference without writing', async () => {
        const result = await handler({ groupId: 'g1', payload }, {});
        expect(client.updateExternalUserGroup).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: { sites: ['s1'] }, alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ groupId: 'g1', payload, dryRun: false }, {});
        expect(client.updateExternalUserGroup).toHaveBeenCalledWith('g1', { ...payload, sites: ['s1', 's2'] }, undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('accepts all-site groups without a site list', async () => {
        const result = await handler({ groupId: 'g1', payload: { name: 'ops', roleId: 'r1', allSite: true }, dryRun: false }, {});
        expect(client.updateExternalUserGroup).toHaveBeenCalledWith('g1', { name: 'ops', roleId: 'r1', allSite: true }, undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('surfaces controller rejections', async () => {
        client.updateExternalUserGroup.mockRejectedValueOnce(new OmadaApiError(-1, 'bad'));
        await expect(handler({ groupId: 'g1', payload, dryRun: false }, {})).rejects.toThrow('(errorCode -1): bad');
    });
});
