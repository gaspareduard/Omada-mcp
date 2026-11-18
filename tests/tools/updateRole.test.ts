import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { OmadaApiError } from '../../src/omadaClient/request.js';
import { registerUpdateRoleTool } from '../../src/tools/updateRole.js';

type Handler = (
    args: Record<string, unknown>,
    extra: object
) => Promise<{ structuredContent?: Record<string, unknown>; content: { text: string }[] }>;

const payload = { name: 'mcp-role', privilege: { devices: 2 } };

describe('tools/updateRole', () => {
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
        registerUpdateRoleTool(server, client as unknown as OmadaClient);
    });

    it('validates the role id and payload', () => {
        expect(() => definition.inputSchema.roleId.parse(' ')).toThrow();
        expect(() => definition.inputSchema.payload.parse({ privilege: {} })).toThrow();
    });

    it('previews the difference without writing', async () => {
        const result = await handler({ roleId: 'r1', payload }, {});
        expect(client.updateRole).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { id: 'r1', alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ roleId: 'r1', payload, dryRun: false }, {});
        expect(client.updateRole).toHaveBeenCalledWith('r1', payload, undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('refuses built-in roles and unknown ids', async () => {
        await expect(handler({ roleId: 'master_admin_id', payload }, {})).rejects.toThrow('built-in role');
        await expect(handler({ roleId: 'missing', payload }, {})).rejects.toThrow('No role with id "missing"');
        expect(client.updateRole).not.toHaveBeenCalled();
    });

    it('surfaces controller rejections', async () => {
        client.updateRole.mockRejectedValueOnce(new OmadaApiError(-30157, 'failed'));
        await expect(handler({ roleId: 'r1', payload, dryRun: false }, {})).rejects.toThrow('(errorCode -30157): failed');
    });
});
