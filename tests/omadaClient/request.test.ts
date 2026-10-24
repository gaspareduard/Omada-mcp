import { AxiosError, AxiosHeaders, type AxiosInstance } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthManager } from '../../src/omadaClient/auth.js';
import { RequestHandler, type RequestHandlerOptions } from '../../src/omadaClient/request.js';
import { logger } from '../../src/utils/logger.js';
import { maskValue } from '../../src/utils/redact.js';

const success = { errorCode: 0, result: { value: 42 } };
function response(data: unknown = success, headers: Record<string, string> = {}) {
    return { data, status: 200, headers };
}
function httpError(status: number, data: unknown = {}, headers: Record<string, string> = {}): AxiosError {
    return new AxiosError('Controller request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
        status,
        data,
        headers,
        statusText: 'Failed',
        config: { headers: new AxiosHeaders() },
    });
}
// Attach rejection handlers before advancing fake time through queued retries.
async function settle<T>(promise: Promise<T>): Promise<T> {
    const pending = promise.then(
        (value) => ({ value }),
        (error: unknown) => ({ error })
    );
    await vi.runAllTimersAsync();
    const result = await pending;
    if ('error' in result) throw result.error;
    return result.value;
}

describe('RequestHandler', () => {
    let http: { request: ReturnType<typeof vi.fn> };
    let auth: { getAccessToken: ReturnType<typeof vi.fn>; clearToken: ReturnType<typeof vi.fn> };
    let handler: RequestHandler;
    const makeHandler = (options: RequestHandlerOptions = {}) =>
        new RequestHandler(http as unknown as AxiosInstance, auth as unknown as AuthManager, options);

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-24T12:00:00Z'));
        vi.spyOn(Math, 'random').mockReturnValue(0);
        vi.spyOn(logger, 'info').mockImplementation(() => undefined);
        vi.spyOn(logger, 'debug').mockImplementation(() => undefined);
        vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
        vi.spyOn(logger, 'error').mockImplementation(() => undefined);
        http = { request: vi.fn().mockResolvedValue(response()) };
        auth = { getAccessToken: vi.fn().mockResolvedValue('access-token'), clearToken: vi.fn() };
        handler = makeHandler();
    });
    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it.each([
        { minRequestIntervalMs: -1 },
        { maxReadRetries: 0.5 },
        { maxRetryDelayMs: Number.NaN },
        { maxPages: 0 },
        { maxRecords: Infinity },
    ])('rejects invalid request bounds %j', (options) => {
        expect(() => makeHandler(options)).toThrow('Invalid request option');
    });
    it('forwards GET params and headers without allowing Authorization override', async () => {
        const params = { siteId: 'lab', page: 1 };
        await expect(settle(handler.get('/items', params, { Authorization: 'wrong', 'X-Trace': 'trace' }))).resolves.toEqual(success);
        expect(http.request).toHaveBeenCalledWith({
            method: 'GET',
            url: '/items',
            params,
            headers: { Authorization: 'AccessToken=access-token', 'X-Trace': 'trace' },
        });
    });
    it.each(['post', 'put', 'patch'] as const)('forwards %s bodies and headers', async (method) => {
        await settle(handler[method]('/action', { enabled: true }, { 'X-Trace': 'trace' }));
        expect(http.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: method.toUpperCase(),
                data: { enabled: true },
                headers: expect.objectContaining({ 'X-Trace': 'trace' }),
            })
        );
    });
    it('forwards DELETE and arbitrary request headers, with default method/URL logging', async () => {
        await settle(handler.delete('/action', { 'X-Trace': 'trace' }));
        expect(http.request).toHaveBeenLastCalledWith(
            expect.objectContaining({ method: 'DELETE', headers: expect.objectContaining({ 'X-Trace': 'trace' }) })
        );
        await settle(handler.request({ headers: { Accept: 'application/json' } }));
        expect(http.request).toHaveBeenLastCalledWith(expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/json' }) }));
        expect(logger.info).toHaveBeenCalledWith('Omada request', expect.objectContaining({ method: 'GET', url: 'unknown-url' }));
    });
    it('paces five concurrent dispatches separately even after cold authentication', async () => {
        const starts: number[] = [];
        auth.getAccessToken.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve('token'), 500)));
        http.request.mockImplementation(() => {
            starts.push(Date.now());
            return Promise.resolve(response());
        });
        await settle(Promise.all(Array.from({ length: 5 }, () => handler.get('/items'))));
        expect(starts.map((time) => time - starts[0])).toEqual([0, 125, 250, 375, 500]);
    });
    it('keeps dispatching after an earlier authentication or request failure', async () => {
        auth.getAccessToken.mockRejectedValueOnce(new Error('Login failed'));
        await expect(settle(handler.get('/items'))).rejects.toThrow('Login failed');
        expect(http.request).not.toHaveBeenCalled();
        http.request.mockRejectedValueOnce(new Error('Failure'));
        await expect(settle(handler.get('/items'))).rejects.toThrow('Failure');
        await expect(settle(handler.get('/items'))).resolves.toEqual(success);
    });
    it.each([-44112, -44113, -44114])('refreshes recoverable token error %s once', async (errorCode) => {
        http.request.mockResolvedValueOnce(response({ errorCode, msg: 'Auth error' }));
        await expect(settle(handler.get('/items'))).resolves.toEqual(success);
        expect(auth.clearToken).toHaveBeenCalledExactlyOnceWith('access-token');
        expect(http.request).toHaveBeenCalledTimes(2);
    });
    it.each([
        'Token expired',
        'token has expired',
        'ACCESS TOKEN HAS EXPIRED',
        'Please re-initiate the refreshToken process',
    ])('recognizes token expiry message %s', async (msg) => {
        http.request.mockResolvedValueOnce(response({ errorCode: -1, msg }));
        await settle(handler.get('/items'));
        expect(auth.clearToken).toHaveBeenCalledTimes(1);
    });
    it.each([-1005, -1505, -44106, -44111, -44116, -44118])('does not refresh or retry nonrecoverable code %s', async (errorCode) => {
        const failure = { errorCode, msg: 'Token expired but operation is forbidden' };
        http.request.mockResolvedValue(response(failure));
        await expect(settle(handler.get('/items'))).resolves.toEqual(failure);
        expect(auth.clearToken).not.toHaveBeenCalled();
        expect(http.request).toHaveBeenCalledTimes(1);
    });
    it.each([
        undefined,
        null,
        'payload',
        { errorCode: -1, msg: 42 },
        { errorCode: 0, msg: 'token expired' },
    ])('does not treat response %j as expired authentication', async (data) => {
        http.request.mockResolvedValue({ data });
        await expect(settle(handler.get('/items'))).resolves.toEqual(data);
        expect(auth.clearToken).not.toHaveBeenCalled();
    });
    it.each([401, 403])('replays a mutation only after explicit authentication rejection (HTTP %s)', async (status) => {
        http.request.mockRejectedValueOnce(httpError(status, status === 403 ? { msg: 'token expired' } : {}));
        await expect(settle(handler.post('/action'))).resolves.toEqual(success);
        expect(auth.clearToken).toHaveBeenCalledTimes(1);
        expect(http.request).toHaveBeenCalledTimes(2);
    });
    it.each(['GET', 'POST'])('never refreshes a plain permission 403 on %s', async (method) => {
        const failure = httpError(403, { msg: 'Permission denied' });
        http.request.mockRejectedValue(failure);
        await expect(settle(handler.request({ method, url: '/items' }))).rejects.toBe(failure);
        expect(http.request).toHaveBeenCalledTimes(1);
        expect(auth.clearToken).not.toHaveBeenCalled();
    });
    it('bounds repeated transport and HTTP-200 authentication failures', async () => {
        const failure = httpError(401);
        http.request.mockRejectedValue(failure);
        await expect(settle(handler.get('/items'))).rejects.toBe(failure);
        expect(http.request).toHaveBeenCalledTimes(2);
        http.request.mockReset().mockResolvedValue(response({ errorCode: -44112 }));
        await expect(settle(handler.get('/items'))).resolves.toEqual({ errorCode: -44112 });
        expect(http.request).toHaveBeenCalledTimes(2);
    });
    it.each([401, 503])('preserves retry=false for HTTP %s', async (status) => {
        const failure = httpError(status);
        http.request.mockRejectedValue(failure);
        await expect(settle(handler.request({ url: '/items' }, false))).rejects.toBe(failure);
        expect(http.request).toHaveBeenCalledTimes(1);
        expect(auth.clearToken).not.toHaveBeenCalled();
    });
    it.each([429, 502, 503, 504])('bounds transient GET retries with exponential backoff for HTTP %s', async (status) => {
        const starts: number[] = [];
        const failure = httpError(status);
        http.request.mockImplementation(() => {
            starts.push(Date.now());
            return Promise.reject(failure);
        });
        await expect(settle(handler.get('/items'))).rejects.toBe(failure);
        const base = status === 429 ? 1000 : 500;
        expect(starts.map((time) => time - starts[0])).toEqual([0, base, base * 3]);
        expect(auth.clearToken).not.toHaveBeenCalled();
    });
    it.each(['POST', 'PATCH', 'PUT', 'DELETE'])('never transiently retries %s', async (method) => {
        const failure = httpError(503);
        http.request.mockRejectedValue(failure);
        await expect(settle(handler.request({ method, url: '/action' }))).rejects.toBe(failure);
        expect(http.request).toHaveBeenCalledTimes(1);
        http.request.mockReset().mockResolvedValue(response({ errorCode: -7132 }));
        await settle(handler.request({ method, url: '/action' }));
        expect(http.request).toHaveBeenCalledTimes(1);
    });
    it.each(['HEAD', 'OPTIONS'])('retries safe %s requests', async (method) => {
        http.request.mockRejectedValueOnce(httpError(502));
        await settle(handler.request({ method }));
        expect(http.request).toHaveBeenCalledTimes(2);
    });
    it('bounds documented busy-envelope retries in success and error responses', async () => {
        http.request.mockResolvedValue(response({ errorCode: -7132 }));
        await expect(settle(handler.get('/items'))).resolves.toEqual({ errorCode: -7132 });
        expect(http.request).toHaveBeenCalledTimes(3);
        http.request
            .mockReset()
            .mockRejectedValueOnce(httpError(400, { errorCode: -7132 }))
            .mockResolvedValue(response());
        await expect(settle(handler.get('/items'))).resolves.toEqual(success);
    });
    it.each(['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'EAI_AGAIN'])('retries read network failure %s', async (code) => {
        http.request.mockRejectedValueOnce(new AxiosError('Network failure', code));
        await expect(settle(handler.get('/items'))).resolves.toEqual(success);
        expect(http.request).toHaveBeenCalledTimes(2);
    });
    it.each([
        new AxiosError('Canceled', 'ERR_CANCELED'),
        new AxiosError('Certificate', 'CERT_HAS_EXPIRED'),
        new Error('Unexpected error'),
        'string failure',
    ])('does not retry unrelated failure %s', async (failure) => {
        http.request.mockRejectedValue(failure);
        await expect(settle(handler.get('/items'))).rejects.toBe(failure);
        expect(http.request).toHaveBeenCalledTimes(1);
    });
    it.each([
        ['2', 2000],
        ['Sat, 24 Oct 2026 12:00:03 GMT', 3000],
        ['bad-header', 500],
        ['-5', 500],
        ['', 500],
        ['Sat, 24 Oct 2026 11:00:00 GMT', 500],
        ['0.75', 750],
    ])('honors Retry-After %s or falls back for invalid/past values', async (retryAfter, expectedDelay) => {
        const start = Date.now();
        http.request.mockRejectedValueOnce(httpError(503, {}, { 'retry-after': String(retryAfter) }));
        await settle(handler.get('/items'));
        expect(Date.now() - start).toBe(expectedDelay);
    });
    it('does not retry earlier than an excessive Retry-After for errors or busy envelopes', async () => {
        const failure = httpError(429, {}, { 'retry-after': '60' });
        http.request.mockRejectedValue(failure);
        await expect(settle(handler.get('/items'))).rejects.toBe(failure);
        expect(http.request).toHaveBeenCalledTimes(1);
        http.request.mockReset().mockResolvedValue(response({ errorCode: -7132 }, { 'retry-after': '60' }));
        await expect(settle(handler.get('/items'))).resolves.toEqual({ errorCode: -7132 });
        expect(http.request).toHaveBeenCalledTimes(1);
    });
    it('applies bounded jitter and configured retry/dispatch limits', async () => {
        vi.mocked(Math.random).mockReturnValue(1);
        handler = makeHandler({ minRequestIntervalMs: 0, maxReadRetries: 1, maxRetryDelayMs: 600 });
        const start = Date.now();
        http.request.mockRejectedValue(httpError(503));
        await expect(settle(handler.get('/items'))).rejects.toThrow('Controller request failed');
        expect(http.request).toHaveBeenCalledTimes(2);
        expect(Date.now() - start).toBe(600);
    });
    it('keeps authentication and transient retry budgets separate', async () => {
        http.request.mockRejectedValueOnce(httpError(503)).mockRejectedValueOnce(httpError(401)).mockRejectedValueOnce(httpError(503));
        await expect(settle(handler.get('/items'))).resolves.toEqual(success);
        expect(http.request).toHaveBeenCalledTimes(4);
        expect(auth.clearToken).toHaveBeenCalledTimes(1);
    });
    it('coalesces real token acquisition across a concurrent authentication rejection wave', async () => {
        const post = vi
            .fn()
            .mockResolvedValueOnce(response({ errorCode: 0, result: { accessToken: 'old', expiresIn: 3600 } }))
            .mockResolvedValue(response({ errorCode: 0, result: { accessToken: 'new', expiresIn: 3600 } }));
        const realAuth = new AuthManager({ post, defaults: {} } as unknown as AxiosInstance, 'id', 'secret', 'controller');
        handler = new RequestHandler(http as unknown as AxiosInstance, realAuth);
        http.request.mockImplementation((config) =>
            config.headers.Authorization === 'AccessToken=old' ? Promise.reject(httpError(401)) : Promise.resolve(response())
        );
        await expect(settle(Promise.all(Array.from({ length: 5 }, () => handler.get('/items'))))).resolves.toEqual(Array(5).fill(success));
        expect(post).toHaveBeenCalledTimes(2);
        expect(http.request).toHaveBeenCalledTimes(10);
    });
    it('uses imported redaction in request/response/error logs without altering sent data', async () => {
        const payload = {
            password: 'short',
            secret: { nested: 'secret' },
            nested: [{ refreshToken: 'long-test-refresh-token', ordinary: false }],
            nullable: null,
        };
        http.request.mockResolvedValueOnce(response(payload, { 'set-cookie': 'session-secret', 'x-public': 'visible' }));
        await settle(handler.post('/items', payload, { 'Client-Id': 'short-id' }));
        await settle(handler.get('/items', { siteId: 'lab', client_secret: 'query-secret' }));
        expect(http.request).toHaveBeenNthCalledWith(1, expect.objectContaining({ data: payload }));
        expect(logger.debug).toHaveBeenCalledWith(
            'Omada request details',
            expect.objectContaining({
                headers: expect.objectContaining({ 'Client-Id': maskValue('short-id') }),
                data: {
                    password: maskValue('short'),
                    secret: maskValue(payload.secret),
                    nested: [{ refreshToken: maskValue('long-test-refresh-token'), ordinary: false }],
                    nullable: null,
                },
            })
        );
        expect(logger.debug).toHaveBeenCalledWith(
            'Omada response payload',
            expect.objectContaining({ headers: { 'set-cookie': maskValue('session-secret'), 'x-public': 'visible' } })
        );
        expect(logger.info).toHaveBeenCalledWith(
            'Omada request',
            expect.objectContaining({ params: { siteId: 'lab', client_secret: maskValue('query-secret') } })
        );
        const failure = httpError(400, { tokens: ['a', 'b'], password: 123 }, { Authorization: 'short', 'x-public': 'visible' });
        http.request.mockRejectedValue(failure);
        await expect(settle(handler.get('/items'))).rejects.toBe(failure);
        expect(logger.debug).toHaveBeenCalledWith(
            'Omada error response payload',
            expect.objectContaining({
                headers: { Authorization: maskValue('short'), 'x-public': 'visible' },
                data: { tokens: maskValue(['a', 'b']), password: maskValue(123) },
            })
        );
    });

    describe('fetchPaginated', () => {
        function pages(...results: unknown[]): void {
            http.request.mockReset();
            for (const result of results) http.request.mockResolvedValueOnce(response({ errorCode: 0, result }));
        }
        it('fetches all advertised rows, preserving filters/headers and controlling pagination', async () => {
            pages({ data: [{ id: 1 }], totalRows: 2, currentPage: 1 }, { data: [{ id: 2 }], currentPage: 2 });
            await expect(settle(handler.fetchPaginated('/items', { filter: 'active', page: 99 }, { 'X-Trace': 'trace' }))).resolves.toEqual([
                { id: 1 },
                { id: 2 },
            ]);
            expect(http.request).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    params: { filter: 'active', page: 2, pageSize: 200 },
                    headers: expect.objectContaining({ 'X-Trace': 'trace' }),
                })
            );
        });
        it('reads to an explicit empty page without totalRows, even after a short page', async () => {
            pages({ data: [{ id: 1 }] }, { data: [{ id: 2 }] }, { data: [] });
            await expect(settle(handler.fetchPaginated('/items'))).resolves.toEqual([{ id: 1 }, { id: 2 }]);
            expect(http.request).toHaveBeenCalledTimes(3);
        });
        it.each([{ data: [], totalRows: 0 }, { data: [] }, { totalRows: 0 }])('accepts legitimate empty result %j', async (result) => {
            pages(result);
            await expect(settle(handler.fetchPaginated('/items'))).resolves.toEqual([]);
            expect(http.request).toHaveBeenCalledTimes(1);
        });
        it.each([
            null,
            undefined,
            {},
            [],
            'wrong',
            1,
            { data: null },
            { data: {} },
            { data: 'wrong' },
            { totalRows: 3 },
        ])('rejects missing/malformed result %j', async (result) => {
            pages(result);
            await expect(settle(handler.fetchPaginated('/items'))).rejects.toThrow(/pagination/i);
        });
        it.each([-1, 1.5, '2', Number.NaN, Infinity])('rejects invalid advertised total %s', async (totalRows) => {
            pages({ data: [], totalRows });
            await expect(settle(handler.fetchPaginated('/items'))).rejects.toThrow('Invalid pagination totalRows');
        });
        it.each([
            { data: [], currentPage: 0 },
            { data: [], currentPage: '1' },
            { data: [], currentSize: -1 },
            { data: [], currentSize: 0.5 },
        ])('rejects malformed page metadata %j', async (result) => {
            pages(result);
            await expect(settle(handler.fetchPaginated('/items'))).rejects.toThrow(/pagination/i);
        });
        it.each([[], undefined])('rejects early %j data before the advertised total', async (data) => {
            pages({ data: [{ id: 1 }], totalRows: 2 }, { data });
            await expect(settle(handler.fetchPaginated('/items'))).rejects.toThrow(/pagination/i);
        });
        it('rejects inconsistent totals and records beyond the total', async () => {
            pages({ data: [{ id: 1 }], totalRows: 2 }, { data: [{ id: 2 }], totalRows: 3 });
            await expect(settle(handler.fetchPaginated('/items'))).rejects.toThrow('totalRows changed');
            pages({ data: [{ id: 1 }], totalRows: 0 });
            await expect(settle(handler.fetchPaginated('/items'))).rejects.toThrow('more records than totalRows');
        });
        it('rejects repeated pages even with reordered keys and rows', async () => {
            pages(
                {
                    data: [
                        { id: 1, name: 'a' },
                        { id: 2, name: 'b' },
                    ],
                },
                {
                    data: [
                        { name: 'b', id: 2 },
                        { name: 'a', id: 1 },
                    ],
                }
            );
            await expect(settle(handler.fetchPaginated('/items'))).rejects.toThrow('Repeated pagination data');
            expect(http.request).toHaveBeenCalledTimes(2);
        });
        it('handles nested and primitive JSON records while bounding pages', async () => {
            handler = makeHandler({ maxPages: 2 });
            pages({ data: [{ values: [1, null] }, 'a'] }, { data: [2] });
            await expect(settle(handler.fetchPaginated('/items'))).rejects.toThrow('Pagination page limit exceeded (2)');
            expect(http.request).toHaveBeenCalledTimes(2);
        });
        it('bounds advertised/accumulated records and oversized controller pages', async () => {
            handler = makeHandler({ maxRecords: 2 });
            pages({ data: [], totalRows: 3 });
            await expect(settle(handler.fetchPaginated('/items'))).rejects.toThrow('Pagination record limit exceeded');
            pages({ data: [1, 2] }, { data: [3] });
            await expect(settle(handler.fetchPaginated('/items'))).rejects.toThrow('Pagination record limit exceeded');
            handler = makeHandler();
            pages({ data: Array.from({ length: 201 }, (_, id) => ({ id })) });
            await expect(settle(handler.fetchPaginated('/items'))).rejects.toThrow('oversized page');
        });
        it('accepts results exactly at the page and record bounds', async () => {
            handler = makeHandler({ maxPages: 2, maxRecords: 2 });
            pages({ data: [1], totalRows: 2 }, { data: [2], totalRows: 2 });
            await expect(settle(handler.fetchPaginated('/items'))).resolves.toEqual([1, 2]);
        });
    });
    describe('ensureSuccess', () => {
        it('preserves success payloads and the existing empty-object default', () => {
            expect(handler.ensureSuccess(success)).toEqual(success.result);
            expect(handler.ensureSuccess({ errorCode: 0 })).toEqual({});
        });
        it('surfaces controller messages and the generic fallback', () => {
            expect(() => handler.ensureSuccess({ errorCode: -1005, msg: 'Operation forbidden' })).toThrow('Operation forbidden');
            expect(() => handler.ensureSuccess({ errorCode: -1 })).toThrow('Omada API request failed');
            expect(logger.error).toHaveBeenCalledWith('Omada API error', { errorCode: -1005, message: 'Operation forbidden' });
        });
        it.each([undefined, null, false, {}, { errorCode: '0' }])('rejects malformed envelope %j', (data) => {
            expect(() => handler.ensureSuccess(data as never)).toThrow('Malformed Omada API response');
        });
    });
});
