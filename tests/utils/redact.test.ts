import { describe, expect, it } from 'vitest';
import { isLikelySensitiveString, isSensitiveKey, maskValue, redactSecrets } from '../../src/utils/redact.js';

describe('redact', () => {
    describe('isSensitiveKey', () => {
        it('matches known secret field names regardless of casing', () => {
            expect(isSensitiveKey('Authorization')).toBe(true);
            expect(isSensitiveKey('token')).toBe(true);
            expect(isSensitiveKey('clientSecret')).toBe(true);
            expect(isSensitiveKey('PASSWORD')).toBe(true);
            expect(isSensitiveKey('Cookie')).toBe(true);
            expect(isSensitiveKey('client-id')).toBe(true);
            expect(isSensitiveKey('client_id')).toBe(true);
            expect(isSensitiveKey('clientId')).toBe(true);
            expect(isSensitiveKey('customHeaders')).toBe(true);
            expect(isSensitiveKey('PSK')).toBe(true);
            expect(isSensitiveKey('key')).toBe(true);
            expect(isSensitiveKey('pin')).toBe(true);
            expect(isSensitiveKey('securityKey')).toBe(true);
        });

        it('does not match non-sensitive field names', () => {
            expect(isSensitiveKey('X-Trace')).toBe(false);
            expect(isSensitiveKey('siteId')).toBe(false);
            expect(isSensitiveKey('value')).toBe(false);
        });
    });

    describe('maskValue', () => {
        it('fully masks short strings to avoid partial disclosure', () => {
            expect(maskValue('short')).toBe('********');
            // 12-char value is still fully masked (boundary)
            expect(maskValue('abcdefghijkl')).toBe('********');
        });

        it('fully masks long strings without revealing a prefix or suffix', () => {
            expect(maskValue('verylongsecretvalue')).toBe('********');
        });

        it('masks arrays and objects', () => {
            expect(maskValue(['a', 'b'])).toEqual(['********', '********']);
            expect(maskValue({ secret: 'value' })).toBe('[masked-object]');
        });

        it('masks non-string primitives', () => {
            expect(maskValue(12345)).toBe('********');
            expect(maskValue(null)).toBe('********');
        });
    });

    describe('isLikelySensitiveString', () => {
        it('flags long credential-like strings', () => {
            expect(isLikelySensitiveString('abcd1234abcd1234abcd')).toBe(true);
        });

        it('ignores short strings', () => {
            expect(isLikelySensitiveString('safe')).toBe(false);
            expect(isLikelySensitiveString('hello world')).toBe(false);
        });
    });
});

describe('redactSecrets', () => {
    it('redacts nested secret fields and array elements without mutating the input', () => {
        const original = {
            siteId: 'site-123',
            mac: 'AA:BB:CC:DD:EE:FF',
            enabled: true,
            password: 'very-long-password-with-recognizable-ends',
            nested: [
                {
                    privateKey: 'private-key',
                    private_key: 'private-key-2',
                    preSharedKey: 'shared',
                    passphrase: 'phrase',
                    community: 'snmp',
                    key: 'key-value',
                    psk: 'psk-value',
                    pin: 1234,
                },
            ],
            customHeaders: { Authorization: 'Bearer secret' },
            token: ['one-secret', 'two-secrets'],
        };
        const copy = structuredClone(original);
        expect(redactSecrets(original)).toEqual({
            siteId: 'site-123',
            mac: 'AA:BB:CC:DD:EE:FF',
            enabled: true,
            password: '********',
            nested: [
                {
                    privateKey: '********',
                    private_key: '********',
                    preSharedKey: '********',
                    passphrase: '********',
                    community: '********',
                    key: '********',
                    psk: '********',
                    pin: '********',
                },
            ],
            customHeaders: '[masked-object]',
            token: ['********', '********'],
        });
        expect(original).toEqual(copy);
    });

    it.each([null, undefined, false, 42, 'ordinary value'])('preserves non-object output %s', (value) => {
        expect(redactSecrets(value)).toBe(value);
    });
});
