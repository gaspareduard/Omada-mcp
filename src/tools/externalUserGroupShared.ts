import type { RecordLike } from './resourceMutationShared.js';

/** Readback lists sites as { id, name } objects; requests send site IDs. */
export function normalizeExternalUserGroup(record: RecordLike): RecordLike {
    if (!Array.isArray(record.sites)) return record;
    const ids = record.sites.map((site) =>
        typeof site === 'object' && site !== null && typeof (site as { id?: unknown }).id === 'string' ? (site as { id: string }).id : site
    );
    return { ...record, sites: [...ids].sort() };
}

/** Sort requested site IDs so they compare with the normalized readback. */
export function sortSites<T extends { sites?: string[] }>(payload: T): T {
    return payload.sites ? { ...payload, sites: [...payload.sites].sort() } : payload;
}
