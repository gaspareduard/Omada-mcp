import { describe, expect, it, vi } from 'vitest';

import {
    createShutdownHandler,
    getRequestUrl,
    isSensitiveKey,
    maskValue,
    sanitizeHeaders,
    sanitizePayload,
    sendJson,
} from '../../src/server/http.js';
import { logger } from '../../src/utils/logger.js';

describe('server/http helpers', () => {
    describe('getRequestUrl', () => {
        it('returns undefined when url missing', () => {
            const req = { url: undefined, headers: {} } as unknown as import('node:http').IncomingMessage;
            expect(getRequestUrl(req, 3000)).toBeUndefined();
        });

        it('resolves relative url using host header', () => {
            const req = { url: '/foo', headers: { host: 'example.com:8080' } } as unknown as import('node:http').IncomingMessage;
            const url = getRequestUrl(req, 3000);
            expect(url?.href).toBe('http://example.com:8080/foo');
        });
    });

    describe('sendJson', () => {
        it('writes response headers and payload', () => {
            const writeHead = vi.fn();
            const end = vi.fn();
            const res = { writeHead, end } as unknown as import('node:http').ServerResponse;

            sendJson(res, 201, { ok: true });

            expect(writeHead).toHaveBeenCalledWith(201, expect.objectContaining({ 'Content-Type': 'application/json' }));
            expect(end).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
        });
    });

    describe('sanitizeHeaders', () => {
        it('masks sensitive headers and keeps arrays', () => {
            const headers = {
                Authorization: 'Bearer secret-token',
                'X-Custom': 'value',
                Cookie: ['foo=bar', 'baz=qux'],
            } satisfies Record<string, string | string[]>;

            const sanitized = sanitizeHeaders(headers);

            expect(sanitized.Authorization).toMatch(/…/);
            expect(sanitized['x-custom']).toBeUndefined();
            expect(sanitized['X-Custom']).toBe('value');
            expect(Array.isArray(sanitized.Cookie)).toBe(true);
        });
    });

    describe('sanitizePayload', () => {
        it('masks nested sensitive fields and strings', () => {
            const payload = {
                token: 'abcd1234abcd1234',
                nested: { password: 'hunter2', value: 'safe' },
                array: ['short', 'averylongstringtokenvaluehere'],
            };

            const sanitized = sanitizePayload(payload) as Record<string, unknown>;

            expect(sanitized.token).toMatch(/…/);
            expect((sanitized.nested as Record<string, unknown>).password).toBe('********');
            expect((sanitized.nested as Record<string, unknown>).value).toBe('safe');
        });
    });

    describe('maskValue utility', () => {
        it('masks strings of varying lengths', () => {
            expect(maskValue('short')).toBe('********');
            expect(maskValue('verylongsecretvalue')).toBe('very…alue');
        });

        it('replaces arrays/objects with masked markers', () => {
            expect(maskValue(['a', 'b'])).toEqual(['********', '********']);
            expect(maskValue({ secret: 'value' })).toBe('[masked-object]');
        });
    });

    describe('isSensitiveKey', () => {
        it('matches various secret field names', () => {
            expect(isSensitiveKey('Authorization')).toBe(true);
            expect(isSensitiveKey('client-id')).toBe(true);
            expect(isSensitiveKey('X-Trace')).toBe(false);
        });
    });

    describe('createShutdownHandler', () => {
        it('closes sessions then http server in order', async () => {
            const closeSessions = vi.fn().mockResolvedValue(undefined);
            const closeHttp = vi.fn().mockResolvedValue(undefined);
            const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
            const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

            await createShutdownHandler('SIGTERM', closeHttp, closeSessions);

            expect(closeSessions).toHaveBeenCalled();
            expect(closeHttp).toHaveBeenCalled();
            warnSpy.mockRestore();
            errorSpy.mockRestore();
        });
    });
});
