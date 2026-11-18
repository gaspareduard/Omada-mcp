import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { OmadaApiError } from '../../src/omadaClient/request.js';
import { registerUpdateSamlIdpTool } from '../../src/tools/updateSamlIdp.js';

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

describe('tools/updateSamlIdp', () => {
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
        registerUpdateSamlIdpTool(server, client as unknown as OmadaClient);
    });

    it('validates the id', () => {
        expect(() => definition.inputSchema.idpId.parse('')).toThrow();
    });

    it('previews the difference without writing', async () => {
        const result = await handler({ idpId: 'i1', payload }, {});
        expect(client.updateSamlIdp).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { id: 'i1' } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ idpId: 'i1', payload, dryRun: false }, {});
        expect(client.updateSamlIdp).toHaveBeenCalledWith('i1', payload, undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('refuses unknown ids', async () => {
        await expect(handler({ idpId: 'nope', payload }, {})).rejects.toThrow('No SAML identity provider');
    });

    it('surfaces controller rejections', async () => {
        client.updateSamlIdp.mockRejectedValueOnce(new OmadaApiError(-1, 'bad'));
        await expect(handler({ idpId: 'i1', payload, dryRun: false }, {})).rejects.toThrow('(errorCode -1): bad');
    });
});
