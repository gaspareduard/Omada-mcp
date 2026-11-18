import { describe, expect, it } from 'vitest';

import { normalizeExternalUserGroup, sortSites } from '../../src/tools/externalUserGroupShared.js';

describe('tools/externalUserGroupShared', () => {
    it('maps readback site objects to sorted site ids', () => {
        expect(normalizeExternalUserGroup({ id: 'g', sites: [{ id: 'b', name: 'B' }, { id: 'a' }, 'c'] })).toEqual({
            id: 'g',
            sites: ['a', 'b', 'c'],
        });
    });

    it('leaves records without a site list unchanged', () => {
        const record = { id: 'g', allSite: true };
        expect(normalizeExternalUserGroup(record)).toBe(record);
    });

    it('sorts requested site ids without mutating the payload', () => {
        const payload = { name: 'x', sites: ['b', 'a'] };
        expect(sortSites(payload)).toEqual({ name: 'x', sites: ['a', 'b'] });
        expect(payload.sites).toEqual(['b', 'a']);
        const noSites = { name: 'y' };
        expect(sortSites(noSites)).toBe(noSites);
    });
});
