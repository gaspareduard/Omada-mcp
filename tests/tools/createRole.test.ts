import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { OmadaApiError } from '../../src/omadaClient/request.js';
import { registerCreateRoleTool } from '../../src/tools/createRole.js';

type Handler = (
    args: Record<string, unknown>,
    extra: object
) => Promise<{ structuredContent?: Record<string, unknown>; content: { text: string }[] }>;

const payload = { name: 'auditors', privilege: { devices: 1, log: 1 } };

describe('tools/createRole', () => {
    let roles: Record<string, unknown>[];
    let handler: Handler;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;

    beforeEach(() => {
        roles = [
            { id: 'master_admin_id', name: 'Owner', defaultRole: true, privilege: { devices: 2 } },
            { id: 'r1', name: 'mcp-role', defaultRole: false, privilege: { devices: 1 } },
        ];
        client = {
            getAllRoles: vi.fn(async () => roles),
            getRoleDetail: vi.fn(async (id: string) => roles.find((role) => role.id === id)),
            createRole: vi.fn((body: Record<string, unknown>) => {
                roles = [...roles, { ...body, id: 'r2', defaultRole: false }];
                return Promise.resolve({ roleId: 'r2' });
            }),
            updateRole: vi.fn((id: string, body: Record<string, unknown>) => {
                roles = roles.map((role) => (role.id === id ? { ...role, ...body } : role));
                return Promise.resolve({});
            }),
            deleteRole: vi.fn((id: string) => {
                roles = roles.filter((role) => role.id !== id);
                return Promise.resolve({});
            }),
        };
        const server = {
            registerTool: vi.fn((_name, def, fn) => {
                definition = def;
                handler = fn;
            }),
        } as unknown as McpServer;
        registerCreateRoleTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
        expect(definition.inputSchema.payload.parse(payload)).toEqual(payload);
    });

    it('previews by default without writing', async () => {
        const result = await handler({ payload }, {});
        expect(client.createRole).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { dryRun: true, existingCount: 2 } });
    });

    it('creates once and verifies through the role detail', async () => {
        const result = await handler({ payload, dryRun: false }, {});
        expect(client.createRole).toHaveBeenCalledTimes(1);
        expect(client.getRoleDetail).toHaveBeenCalledWith('r2', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified', result: { createdId: 'r2' } });
    });

    it('refuses a duplicate name', async () => {
        await expect(handler({ payload: { name: 'mcp-role' } }, {})).rejects.toThrow('already exists');
    });

    it('surfaces controller rejections', async () => {
        client.createRole.mockRejectedValueOnce(new OmadaApiError(-30161, 'limit'));
        await expect(handler({ payload, dryRun: false }, {})).rejects.toThrow('(errorCode -30161): limit');
    });
});
