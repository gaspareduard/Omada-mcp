import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LogOperations } from '../../src/omadaClient/log.js';
import type { RequestHandler } from '../../src/omadaClient/request.js';
import type { SiteOperations } from '../../src/omadaClient/site.js';
import { registerDiagnoseLogsTool } from '../../src/tools/diagnoseLogs.js';
import type { OmadaApiResponse } from '../../src/types/index.js';
import { toolHarness } from '../helpers/toolHarness.js';

describe('diagnoseLogs', () => {
    const now = 1792845296789;
    beforeEach(() => {
        vi.spyOn(Date, 'now').mockReturnValue(now);
    });
    afterEach(() => vi.restoreAllMocks());

    function setup() {
        const client = {
            resolveSiteId: vi.fn(async () => 'resolved'),
            listSiteEvents: vi.fn(async () => ({ data: [], totalRows: 0 })),
            listSiteAlerts: vi.fn(async () => ({ data: [1], totalRows: 3 })),
            listSiteAuditLogs: vi.fn(async () => ({ data: [], totalRows: 0 })),
            getLogSettingForSite: vi.fn(async () => ({})),
            getAuditLogSettingForSite: vi.fn(async () => ({})),
        };
        return { client, tool: toolHarness(registerDiagnoseLogsTool, client) };
    }
    it('uses one explicit millisecond window and labels first-page evidence', async () => {
        const { client, tool } = setup();
        const result = await tool.invoke();
        expect(result).toMatchObject({ siteId: 'resolved', complete: true, inventoryComplete: false, pageLimit: 20 });
        expect(client.resolveSiteId).toHaveBeenCalledExactlyOnceWith(undefined);
        const query = { page: 1, pageSize: 20, startTime: now - 86400000, endTime: now };
        for (const method of [client.listSiteEvents, client.listSiteAlerts, client.listSiteAuditLogs]) {
            expect(method).toHaveBeenCalledExactlyOnceWith(query, 'resolved', undefined);
        }
        expect(result.window).toEqual({
            startTime: now - 86400000,
            endTime: now,
            unit: 'unix-milliseconds',
            timezone: 'UTC',
            appliesTo: ['events', 'alerts', 'audit'],
        });
        expect((result.observations as Record<string, string>).events).toContain('does not prove');
        expect(tool.schema().safeParse({ windowHours: 169 }).success).toBe(false);
    });

    it('carries the requested window through real log operations including the audit JSON range', async () => {
        const get = vi.fn(async () => ({ errorCode: 0, result: { data: [], totalRows: 0 } }));
        const request = { get, ensureSuccess: (response: OmadaApiResponse<unknown>) => response.result } as unknown as RequestHandler;
        const resolveSiteId = vi.fn(async (siteId?: string) => siteId ?? 'default-site');
        const site = { resolveSiteId } as unknown as SiteOperations;
        const client = Object.assign(new LogOperations(request, site, (path) => `/openapi/v1/controller${path}`), { resolveSiteId });
        const tool = toolHarness(registerDiagnoseLogsTool, client);
        const headers = { 'X-Request-Id': 'diagnose' };

        const result = await tool.invoke({ siteId: 'site/123', customHeaders: headers, windowHours: 2 });

        expect(result).toMatchObject({
            complete: true,
            inventoryComplete: false,
            window: { startTime: now - 7200000, endTime: now },
        });
        expect(get).toHaveBeenCalledTimes(5);
        for (const route of ['events', 'alerts']) {
            expect(get).toHaveBeenCalledWith(
                `/openapi/v1/controller/sites/site%2F123/logs/${route}`,
                { page: 1, pageSize: 20, 'filters.timeStart': now - 7200000, 'filters.timeEnd': now },
                headers
            );
        }
        expect(get).toHaveBeenCalledWith(
            '/openapi/v1/controller/sites/site%2F123/audit-logs',
            { page: 1, pageSize: 20, 'filters.times': '[{"timeStart":1792838096789,"timeEnd":1792845296789}]' },
            headers
        );
        for (const route of ['log-notification', 'audit-notification']) {
            expect(get).toHaveBeenCalledWith(`/openapi/v1/controller/sites/site%2F123/site/${route}`, undefined, headers);
        }
        expect(result.limitation).toContain('current snapshots');
    });

    it('separates failed access from zero events', async () => {
        const { client, tool } = setup();
        client.listSiteEvents.mockRejectedValue(new Error('denied'));
        expect(await tool.invoke({ windowHours: 2 })).toMatchObject({
            complete: false,
            missing: ['events'],
            sections: { events: { status: 'unavailable' } },
        });
    });

    it('keeps audit failure distinct from an empty in-window result', async () => {
        const { client, tool } = setup();
        client.listSiteAuditLogs.mockRejectedValue(new Error('audit permission denied'));
        const result = await tool.invoke();
        expect(result).toMatchObject({
            complete: false,
            inventoryComplete: false,
            missing: ['audit'],
            sections: { events: { status: 'ok', data: { data: [] } }, audit: { status: 'unavailable' } },
            observations: { audit: 'Unavailable; no conclusion about event activity is possible.' },
        });
    });
});
