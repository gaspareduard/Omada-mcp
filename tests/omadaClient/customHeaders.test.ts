import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AxiosInstance, RawAxiosRequestHeaders } from 'axios';
import axios from 'axios';
import { AuthManager } from '../../src/omadaClient/auth.js';
import { RequestHandler } from '../../src/omadaClient/request.js';
import type { CustomHeaders } from '../../src/types/index.js';

describe('Custom Headers Support', () => {
    let http: AxiosInstance;
    let auth: AuthManager;
    let handler: RequestHandler;

    beforeEach(() => {
        http = axios.create({
            baseURL: 'https://test.local',
        });

        auth = new AuthManager(http, 'test-client', 'test-secret', 'test-omadac');
        handler = new RequestHandler(http, auth);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('RequestHandler', () => {
        it('should merge custom headers with auth headers in request', async () => {
            const customHeaders: CustomHeaders = {
                'X-Custom-Header': 'custom-value',
                'X-Another-Header': 'another-value',
            };

            // Mock auth to return a token
            vi.spyOn(auth, 'getAccessToken').mockResolvedValue('test-token');

            // Mock the http request
            const requestSpy = vi.spyOn(http, 'request').mockResolvedValue({
                data: { test: 'data' },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: { headers: {} as RawAxiosRequestHeaders },
            });

            await handler.get('/test', undefined, customHeaders);

            // Verify that custom headers were included in the request
            expect(requestSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Custom-Header': 'custom-value',
                        'X-Another-Header': 'another-value',
                        Authorization: 'AccessToken=test-token',
                    }),
                })
            );
        });

        it('should work without custom headers', async () => {
            // Mock auth to return a token
            vi.spyOn(auth, 'getAccessToken').mockResolvedValue('test-token');

            // Mock the http request
            const requestSpy = vi.spyOn(http, 'request').mockResolvedValue({
                data: { test: 'data' },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: { headers: {} as RawAxiosRequestHeaders },
            });

            await handler.get('/test');

            // Verify that only auth headers are present
            expect(requestSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'AccessToken=test-token',
                    }),
                })
            );

            // Verify no custom headers are present
            const callArgs = requestSpy.mock.calls[0][0];
            expect(callArgs.headers).not.toHaveProperty('X-Custom-Header');
        });

        it('should not allow custom headers to override Authorization header', async () => {
            const customHeaders: CustomHeaders = {
                Authorization: 'Bearer fake-token',
                'X-Custom-Header': 'custom-value',
            };

            // Mock auth to return a token
            vi.spyOn(auth, 'getAccessToken').mockResolvedValue('test-token');

            // Mock the http request
            const requestSpy = vi.spyOn(http, 'request').mockResolvedValue({
                data: { test: 'data' },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: { headers: {} as RawAxiosRequestHeaders },
            });

            await handler.get('/test', undefined, customHeaders);

            // Verify that Authorization header uses the auth token, not custom value
            const callArgs = requestSpy.mock.calls[0][0];
            expect(callArgs.headers?.Authorization).toBe('AccessToken=test-token');
            expect(callArgs.headers?.Authorization).not.toBe('Bearer fake-token');
        });

        it('should pass custom headers through retry logic', async () => {
            const customHeaders: CustomHeaders = {
                'X-Custom-Header': 'custom-value',
            };

            // Mock auth to return a token
            vi.spyOn(auth, 'getAccessToken').mockResolvedValue('test-token');
            const clearTokenSpy = vi.spyOn(auth, 'clearToken');

            // Mock the http request to fail with 401 on first call, then succeed
            const requestSpy = vi
                .spyOn(http, 'request')
                .mockRejectedValueOnce({
                    isAxiosError: true,
                    response: {
                        status: 401,
                        data: {},
                    },
                })
                .mockResolvedValueOnce({
                    data: { test: 'data' },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: { headers: {} as RawAxiosRequestHeaders },
                });

            await handler.get('/test', undefined, customHeaders);

            // Verify clearToken was called
            expect(clearTokenSpy).toHaveBeenCalled();

            // Verify that custom headers were included in both attempts
            expect(requestSpy).toHaveBeenCalledTimes(2);
            expect(requestSpy).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Custom-Header': 'custom-value',
                    }),
                })
            );
            expect(requestSpy).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Custom-Header': 'custom-value',
                    }),
                })
            );
        });

        it('should pass custom headers to fetchPaginated', async () => {
            const customHeaders: CustomHeaders = {
                'X-Custom-Header': 'custom-value',
            };

            // Mock auth to return a token
            vi.spyOn(auth, 'getAccessToken').mockResolvedValue('test-token');

            // Mock the http request to return paginated data
            const requestSpy = vi.spyOn(http, 'request').mockResolvedValue({
                data: {
                    errorCode: 0,
                    result: {
                        data: [{ id: 1 }, { id: 2 }],
                        totalRows: 2,
                    },
                },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: { headers: {} as RawAxiosRequestHeaders },
            });

            await handler.fetchPaginated('/test', {}, customHeaders);

            // Verify that custom headers were included
            expect(requestSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Custom-Header': 'custom-value',
                    }),
                })
            );
        });
    });
});
