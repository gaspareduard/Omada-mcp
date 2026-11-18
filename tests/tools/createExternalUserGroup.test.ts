import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { OmadaApiError } from '../../src/omadaClient/request.js';
import { registerCreateExternalUserGroupTool } from '../../src/tools/createExternalUserGroup.js';

type Handler = (
    args: Record<string, unknown>,
    extra: object
) => Promise<{ structuredContent?: Record<string, unknown>; content: { text: string }[] }>;

const payload = { name: 'netops', roleId: 'r1', allSite: false, sites: ['s2', 's1'] };

describe('tools/createExternalUserGroup', () => {
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
        registerCreateExternalUserGroupTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ name: 'x', roleId: 'r1' })).toThrow();
        expect(definition.inputSchema.payload.parse(payload)).toEqual(payload);
    });

    it('previews with site ids sorted', async () => {
        const result = await handler({ payload }, {});
        expect(client.createExternalUserGroup).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { planned: { sites: ['s1', 's2'] } } });
    });

    it('creates once and verifies site objects against site ids', async () => {
        const result = await handler({ payload, dryRun: false }, {});
        expect(client.createExternalUserGroup).toHaveBeenCalledWith({ ...payload, sites: ['s1', 's2'] }, undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified', result: { createdId: 'g2' } });
    });

    it('surfaces controller rejections', async () => {
        client.createExternalUserGroup.mockRejectedValueOnce(new OmadaApiError(-1, 'role'));
        await expect(handler({ payload, dryRun: false }, {})).rejects.toThrow('(errorCode -1): role');
    });
});
