import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { OmadaApiError } from '../../src/omadaClient/request.js';
import { registerDeleteSamlIdpTool } from '../../src/tools/deleteSamlIdp.js';

type Handler = (
    args: Record<string, unknown>,
    extra: object
) => Promise<{ structuredContent?: Record<string, unknown>; content: { text: string }[] }>;

describe('tools/deleteSamlIdp', () => {
    let idps: Record<string, unknown>[];
    let handler: Handler;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;

    beforeEach(() => {
        idps = [{ id: 'i1', name: 'corp', entityId: 'https://idp.example.com/a', loginUrl: 'https://idp.example.com/sso', x509Certificate: 'AAA' }];
        client = {
            listSamlIdps: vi.fn(async () => idps),
            createSamlIdp: vi.fn((body: Record<string, unknown>) => {
                idps = [...idps, { ...body, id: 'i2', entityUrl: 'https://controller/sp' }];
                return Promise.resolve({ id: 'i2' });
            }),
            updateSamlIdp: vi.fn((id: string, body: Record<string, unknown>) => {
                idps = idps.map((idp) => (idp.id === id ? { ...idp, ...body } : idp));
                return Promise.resolve({});
            }),
            deleteSamlIdp: vi.fn((id: string) => {
                idps = idps.filter((idp) => idp.id !== id);
                return Promise.resolve({});
            }),
        };
        const server = {
            registerTool: vi.fn((_name, def, fn) => {
                definition = def;
                handler = fn;
            }),
        } as unknown as McpServer;
        registerDeleteSamlIdpTool(server, client as unknown as OmadaClient);
    });

    it('validates the id', () => {
        expect(() => definition.inputSchema.idpId.parse('')).toThrow();
    });

    it('previews the record without deleting', async () => {
        const result = await handler({ idpId: 'i1' }, {});
        expect(client.deleteSamlIdp).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: { name: 'corp' } } });
    });

    it('deletes once and verifies it is gone', async () => {
        const result = await handler({ idpId: 'i1', dryRun: false }, {});
        expect(client.deleteSamlIdp).toHaveBeenCalledWith('i1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('surfaces controller rejections', async () => {
        client.deleteSamlIdp.mockRejectedValueOnce(new OmadaApiError(-1, 'in use'));
        await expect(handler({ idpId: 'i1', dryRun: false }, {})).rejects.toThrow('(errorCode -1): in use');
    });
});
