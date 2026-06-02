import { describe, expect, it } from 'vitest';
import { isLikelySensitiveString, isSensitiveKey, maskValue } from '../../src/utils/redact.js';

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

        it('reveals only a prefix/suffix for long strings', () => {
            expect(maskValue('verylongsecretvalue')).toBe('very…alue');
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
