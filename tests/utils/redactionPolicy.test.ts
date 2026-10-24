import { describe, expect, it } from 'vitest';
import { safeSerialize } from '../../src/server/common.js';
import { isSensitiveKey, redactSecrets } from '../../src/utils/redact.js';

describe('shared credential redaction policy', () => {
    it.each(['psk', 'PSK', 'key', 'pin', 'securitykey', 'securityKey'])('masks %s identically in logs and tool responses', (key) => {
        const input = { ssidOverrides: [{ [key]: 'testpass', name: 'visible-name' }] };
        expect(isSensitiveKey(key)).toBe(true);
        expect(safeSerialize(input)).not.toContain('testpass');
        expect(redactSecrets(input)).toEqual({ ssidOverrides: [{ [key]: '********', name: 'visible-name' }] });
        expect(input.ssidOverrides[0][key]).toBe('testpass');
    });
});
