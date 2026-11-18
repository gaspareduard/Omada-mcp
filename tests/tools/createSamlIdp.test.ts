import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { OmadaApiError } from '../../src/omadaClient/request.js';
import { registerCreateSamlIdpTool } from '../../src/tools/createSamlIdp.js';

type Handler = (
    args: Record<string, unknown>,
    extra: object
) => Promise<{ structuredContent?: Record<string, unknown>; content: { text: string }[] }>;

const payload = {
    name: 'partner',
    entityId: 'https://partner.example.com/meta',
    loginUrl: 'https://partner.example.com/sso',
    x509Certificate: 'BBB',
};

describe('tools/createSamlIdp', () => {
    let idps: Record<string, unknown>[];
    let handler: Handler;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;

    beforeEach(() => {
        idps = [
            { idpId: 'i1', name: 'corp', entityId: 'https://idp.example.com/a', loginUrl: 'https://idp.example.com/sso', x509Certificate: 'AAA' },
        ];
        client = {
            listSamlIdps: vi.fn(async () => idps),
            createSamlIdp: vi.fn((body: Record<string, unknown>) => {
                idps = [...idps, { ...body, idpId: 'i2', entityUrl: 'https://controller/sp' }];
                return Promise.resolve({ id: 'i2' });
            }),
            updateSamlIdp: vi.fn((id: string, body: Record<string, unknown>) => {
                idps = idps.map((idp) => (idp.idpId === id ? { ...idp, ...body } : idp));
                return Promise.resolve({});
            }),
            deleteSamlIdp: vi.fn((id: string) => {
                idps = idps.filter((idp) => idp.idpId !== id);
                return Promise.resolve({});
            }),
        };
        const server = {
            registerTool: vi.fn((_name, def, fn) => {
                definition = def;
                handler = fn;
            }),
        } as unknown as McpServer;
        registerCreateSamlIdpTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, entityId: 'not a url' })).toThrow();
        expect(definition.inputSchema.payload.parse(payload)).toEqual(payload);
    });

    it('previews by default without writing', async () => {
        const result = await handler({ payload }, {});
        expect(client.createSamlIdp).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned' });
    });

    it('creates once and verifies the readback by idpId', async () => {
        const result = await handler({ payload, dryRun: false }, {});
        expect(client.createSamlIdp).toHaveBeenCalledTimes(1);
        expect(result.structuredContent).toMatchObject({ status: 'verified', result: { createdId: 'i2' } });
    });

    it('surfaces controller rejections', async () => {
        client.createSamlIdp.mockRejectedValueOnce(new OmadaApiError(-1, 'dup'));
        await expect(handler({ payload, dryRun: false }, {})).rejects.toThrow('(errorCode -1): dup');
    });
});
