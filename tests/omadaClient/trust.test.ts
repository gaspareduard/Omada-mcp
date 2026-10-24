import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OmadaClient } from '../../src/omadaClient/index.js';

const options = { baseUrl: 'https://controller.invalid', clientId: 'fixture', clientSecret: 'fixture', omadacId: 'fixture', strictSsl: true };
afterEach(() => vi.restoreAllMocks());

describe('controller trust configuration', () => {
    it('loads an explicit CA bundle, preserves hostname verification and disables redirects', () => {
        const dir = mkdtempSync(join(tmpdir(), 'omada-ca-test-'));
        try {
            const caFile = join(dir, 'ca.pem');
            writeFileSync(caFile, 'fixture-ca-data');
            const create = vi.spyOn(axios, 'create');
            new OmadaClient({ ...options, caFile });
            const config = create.mock.calls[0][0];
            expect(config?.maxRedirects).toBe(0);
            expect(config?.httpsAgent.options).toMatchObject({ rejectUnauthorized: true, ca: Buffer.from('fixture-ca-data') });
            expect(config?.httpsAgent.options.checkServerIdentity).toBeUndefined();
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
    it('fails before creating an HTTP client if a configured CA cannot be read', () => {
        const create = vi.spyOn(axios, 'create');
        expect(() => new OmadaClient({ ...options, caFile: '/nonexistent-omada-fixture/ca.pem' })).toThrow();
        expect(create).not.toHaveBeenCalled();
    });
});
