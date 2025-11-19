import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios');

describe('RequestHandler', () => {
    let mockAxiosInstance: {
        request: ReturnType<typeof vi.fn>;
    };
    let mockAuthManager: {
        getAccessToken: ReturnType<typeof vi.fn>;
        refreshAccessToken: ReturnType<typeof vi.fn>;
        clearToken?: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        mockAxiosInstance = {
            request: vi.fn(),
        };

        mockAuthManager = {
            getAccessToken: vi.fn().mockResolvedValue('test-access-token'),
            refreshAccessToken: vi.fn().mockResolvedValue(undefined),
            clearToken: vi.fn(),
        };

        vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as never);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('get', () => {
        it('should make a GET request with access token', async () => {
            const { RequestHandler } = await import('../../src/omadaClient/request.js');

            mockAxiosInstance.request.mockResolvedValue({
                data: { errorCode: 0, msg: 'Success', result: { data: 'test-result' } },
            });

            const handler = new RequestHandler(mockAxiosInstance as never, mockAuthManager as never);
            const result = await handler.get<{ errorCode: number; msg: string; result: { data: string } }>('/api/test');

            expect(mockAuthManager.getAccessToken).toHaveBeenCalled();
            expect(mockAxiosInstance.request).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'GET',
                    url: '/api/test',
                    headers: expect.objectContaining({
                        Authorization: 'AccessToken=test-access-token',
                    }),
                })
            );
            // get returns the full OmadaApiResponse
            expect(result).toEqual({ errorCode: 0, msg: 'Success', result: { data: 'test-result' } });
        });

        it('should pass query parameters', async () => {
            const { RequestHandler } = await import('../../src/omadaClient/request.js');

            mockAxiosInstance.request.mockResolvedValue({
                data: { errorCode: 0, msg: 'Success', result: { items: [] } },
            });

            const handler = new RequestHandler(mockAxiosInstance as never, mockAuthManager as never);
            await handler.get('/api/items', { page: 1, pageSize: 50 });

            expect(mockAxiosInstance.request).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: { page: 1, pageSize: 50 },
                })
            );
        });
    });

    describe('request', () => {
        it('should handle successful response', async () => {
            const { RequestHandler } = await import('../../src/omadaClient/request.js');

            mockAxiosInstance.request.mockResolvedValue({
                data: { errorCode: 0, msg: 'Success', result: { value: 42 } },
            });

            const handler = new RequestHandler(mockAxiosInstance as never, mockAuthManager as never);
            const result = await handler.request<{ errorCode: number; msg: string; result: { value: number } }>({
                method: 'POST',
                url: '/api/action',
            });

            // request returns the full axios response data (OmadaApiResponse)
            expect(result).toEqual({ errorCode: 0, msg: 'Success', result: { value: 42 } });
        });

        it('should retry on 401 error and refresh token', async () => {
            const { RequestHandler } = await import('../../src/omadaClient/request.js');

            // Mock axios.isAxiosError to return true for our error object
            vi.mocked(axios.isAxiosError).mockReturnValue(true);

            const error401 = {
                response: { status: 401, data: { msg: 'Invalid token' } },
                isAxiosError: true,
            };

            // First request fails with 401
            mockAxiosInstance.request
                .mockRejectedValueOnce(error401)
                // Second request succeeds after token refresh
                .mockResolvedValueOnce({
                    data: { errorCode: 0, msg: 'Success', result: { refreshed: true } },
                });

            mockAuthManager.clearToken = vi.fn();

            const handler = new RequestHandler(mockAxiosInstance as never, mockAuthManager as never);
            const result = await handler.request<{ errorCode: number; msg: string; result: { refreshed: boolean } }>({
                method: 'GET',
                url: '/api/secure',
            });

            expect(mockAuthManager.clearToken).toHaveBeenCalledTimes(1);
            expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ errorCode: 0, msg: 'Success', result: { refreshed: true } });
        });

        it('should retry on 401 if retry=false', async () => {
            const { RequestHandler } = await import('../../src/omadaClient/request.js');

            mockAxiosInstance.request.mockRejectedValue({
                response: { status: 401, data: { msg: 'Invalid token' } },
                isAxiosError: true,
            });

            const handler = new RequestHandler(mockAxiosInstance as never, mockAuthManager as never);

            await expect(handler.request<unknown>({ method: 'GET', url: '/api/secure' }, false)).rejects.toThrow();

            expect(mockAuthManager.refreshAccessToken).not.toHaveBeenCalled();
            expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
        });

        it('should retry on token expiration error message', async () => {
            const { RequestHandler } = await import('../../src/omadaClient/request.js');

            // Mock axios.isAxiosError to return true for our error object
            vi.mocked(axios.isAxiosError).mockReturnValue(true);

            const tokenExpiredError = {
                response: {
                    status: 200, // Sometimes errors come with 200 status
                    data: {
                        errorCode: -1,
                        msg: 'The access token has expired. Please re-initiate the refreshToken process to obtain the access token.',
                    },
                },
                isAxiosError: true,
            };

            // First request fails with token expired message
            mockAxiosInstance.request
                .mockResolvedValueOnce({
                    data: tokenExpiredError.response.data,
                })
                // Second request succeeds after token refresh
                .mockResolvedValueOnce({
                    data: { errorCode: 0, msg: 'Success', result: { refreshed: true } },
                });

            mockAuthManager.clearToken = vi.fn();

            const handler = new RequestHandler(mockAxiosInstance as never, mockAuthManager as never);
            const result = await handler.request<{ errorCode: number; msg: string; result?: { refreshed: boolean } }>({
                method: 'GET',
                url: '/api/secure',
            });

            expect(mockAuthManager.clearToken).toHaveBeenCalledTimes(1);
            expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ errorCode: 0, msg: 'Success', result: { refreshed: true } });
        });

        it('should retry on various token expiration messages', async () => {
            const { RequestHandler } = await import('../../src/omadaClient/request.js');

            const expirationMessages = [
                'Token expired',
                'token has expired',
                'ACCESS TOKEN HAS EXPIRED',
                'Please re-initiate the refreshToken process',
            ];

            for (const msg of expirationMessages) {
                mockAxiosInstance.request
                    .mockResolvedValueOnce({
                        data: { errorCode: -1, msg },
                    })
                    .mockResolvedValueOnce({
                        data: { errorCode: 0, msg: 'Success', result: {} },
                    });

                mockAuthManager.clearToken = vi.fn();

                const handler = new RequestHandler(mockAxiosInstance as never, mockAuthManager as never);
                await handler.request({ method: 'GET', url: '/api/test' });

                expect(mockAuthManager.clearToken).toHaveBeenCalledTimes(1);
            }
        });

        it('should retry on auth error codes', async () => {
            const { RequestHandler } = await import('../../src/omadaClient/request.js');

            const authErrorCodes = [-44106, -44111, -44112, -44113, -44114, -44116];

            for (const errorCode of authErrorCodes) {
                mockAxiosInstance.request
                    .mockResolvedValueOnce({
                        data: { errorCode, msg: 'Auth error' },
                    })
                    .mockResolvedValueOnce({
                        data: { errorCode: 0, msg: 'Success', result: {} },
                    });

                mockAuthManager.clearToken = vi.fn();

                const handler = new RequestHandler(mockAxiosInstance as never, mockAuthManager as never);
                await handler.request({ method: 'GET', url: '/api/test' });

                expect(mockAuthManager.clearToken).toHaveBeenCalledTimes(1);
            }
        });

        it('should return response with errorCode without throwing', async () => {
            const { RequestHandler } = await import('../../src/omadaClient/request.js');

            mockAxiosInstance.request.mockResolvedValue({
                data: { errorCode: 1234, msg: 'Something went wrong' },
            });

            const handler = new RequestHandler(mockAxiosInstance as never, mockAuthManager as never);
            const result = await handler.request<{ errorCode: number; msg: string }>({ method: 'GET', url: '/api/fails' });

            // request doesn't check errorCode, it just returns the response
            // ensureSuccess() is responsible for throwing on non-zero errorCode
            expect(result).toEqual({ errorCode: 1234, msg: 'Something went wrong' });
        });

        it('should handle network errors', async () => {
            const { RequestHandler } = await import('../../src/omadaClient/request.js');

            mockAxiosInstance.request.mockRejectedValue(new Error('Network timeout'));

            const handler = new RequestHandler(mockAxiosInstance as never, mockAuthManager as never);

            await expect(handler.request<unknown>({ method: 'GET', url: '/api/network' })).rejects.toThrow('Network timeout');
        });
    });

    describe('fetchPaginated', () => {
        it('should fetch all pages until totalRows is reached', async () => {
            const { RequestHandler } = await import('../../src/omadaClient/request.js');

            // First page
            mockAxiosInstance.request
                .mockResolvedValueOnce({
                    data: {
                        errorCode: 0,
                        msg: 'Success',
                        result: {
                            data: [{ id: 1 }, { id: 2 }],
                            totalRows: 3,
                        },
                    },
                })
                // Second page
                .mockResolvedValueOnce({
                    data: {
                        errorCode: 0,
                        msg: 'Success',
                        result: {
                            data: [{ id: 3 }],
                            totalRows: 3,
                        },
                    },
                });

            const handler = new RequestHandler(mockAxiosInstance as never, mockAuthManager as never);
            const result = await handler.fetchPaginated<{ id: number }>('/api/items');

            expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
            expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
        });

        it('should stop when page returns empty data', async () => {
            const { RequestHandler } = await import('../../src/omadaClient/request.js');

            mockAxiosInstance.request
                .mockResolvedValueOnce({
                    data: {
                        errorCode: 0,
                        msg: 'Success',
                        result: {
                            data: [{ id: 1 }],
                            totalRows: 10,
                        },
                    },
                })
                .mockResolvedValueOnce({
                    data: {
                        errorCode: 0,
                        msg: 'Success',
                        result: {
                            data: [],
                            totalRows: 10,
                        },
                    },
                });

            const handler = new RequestHandler(mockAxiosInstance as never, mockAuthManager as never);
            const result = await handler.fetchPaginated<{ id: number }>('/api/items');

            expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
            expect(result).toEqual([{ id: 1 }]);
        });

        it('should pass additional params to each page request', async () => {
            const { RequestHandler } = await import('../../src/omadaClient/request.js');

            mockAxiosInstance.request.mockResolvedValue({
                data: {
                    errorCode: 0,
                    msg: 'Success',
                    result: {
                        data: [],
                        totalRows: 0,
                    },
                },
            });

            const handler = new RequestHandler(mockAxiosInstance as never, mockAuthManager as never);
            await handler.fetchPaginated('/api/items', { siteId: 'test-site', filter: 'active' });

            expect(mockAxiosInstance.request).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        page: 1,
                        pageSize: 200,
                        siteId: 'test-site',
                        filter: 'active',
                    }),
                })
            );
        });
    });

    describe('ensureSuccess', () => {
        it('should return result for successful response', async () => {
            const { RequestHandler } = await import('../../src/omadaClient/request.js');

            const handler = new RequestHandler(mockAxiosInstance as never, mockAuthManager as never);
            const result = handler.ensureSuccess({
                errorCode: 0,
                msg: 'Success',
                result: { value: 123 },
            });

            expect(result).toEqual({ value: 123 });
        });

        it('should throw error for non-zero errorCode', async () => {
            const { RequestHandler } = await import('../../src/omadaClient/request.js');

            const handler = new RequestHandler(mockAxiosInstance as never, mockAuthManager as never);

            expect(() =>
                handler.ensureSuccess({
                    errorCode: 1001,
                    msg: 'Invalid parameters',
                    result: null,
                })
            ).toThrow('Invalid parameters');
        });

        it('should return empty object if result is missing', async () => {
            const { RequestHandler } = await import('../../src/omadaClient/request.js');

            const handler = new RequestHandler(mockAxiosInstance as never, mockAuthManager as never);
            const result = handler.ensureSuccess({
                errorCode: 0,
                msg: 'Success',
                result: undefined,
            });

            expect(result).toEqual({});
        });
    });
});
