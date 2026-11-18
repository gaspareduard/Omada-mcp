import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { OmadaApiError } from '../../src/omadaClient/request.js';
import { registerDeleteExternalUserGroupTool } from '../../src/tools/deleteExternalUserGroup.js';

type Handler = (
    args: Record<string, unknown>,
    extra: object
) => Promise<{ structuredContent?: Record<string, unknown>; content: { text: string }[] }>;

describe('tools/deleteExternalUserGroup', () => {
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
        registerDeleteExternalUserGroupTool(server, client as unknown as OmadaClient);
    });

    it('validates the id', () => {
        expect(() => definition.inputSchema.groupId.parse('')).toThrow();
    });

    it('previews the record without deleting', async () => {
        const result = await handler({ groupId: 'g1' }, {});
        expect(client.deleteExternalUserGroup).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: { name: 'ops' } } });
    });

    it('deletes once and verifies it is gone', async () => {
        const result = await handler({ groupId: 'g1', dryRun: false }, {});
        expect(client.deleteExternalUserGroup).toHaveBeenCalledWith('g1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('surfaces controller rejections', async () => {
        client.deleteExternalUserGroup.mockRejectedValueOnce(new OmadaApiError(-1, 'no'));
        await expect(handler({ groupId: 'g1', dryRun: false }, {})).rejects.toThrow('(errorCode -1): no');
    });
});
