import type { AxiosInstance } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthManager } from '../../src/omadaClient/auth.js';
import type { OmadaApiResponse, TokenResult } from '../../src/types/index.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('AuthManager', () => {
    let authManager: AuthManager;
    let mockHttp: AxiosInstance;
    const clientId = 'test-client-id';
    const clientSecret = 'test-client-secret';
    const omadacId = 'test-omadac-id';

    beforeEach(() => {
        mockHttp = {
            defaults: { baseURL: 'https://test.example.com' },
            post: vi.fn(),
        } as unknown as AxiosInstance;

        authManager = new AuthManager(mockHttp, clientId, clientSecret, omadacId);

        // Mock logger to avoid console output during tests
        vi.spyOn(loggerModule.logger, 'error').mockImplementation(() => {
            // Mock implementation
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getAccessToken', () => {
        it('shares a concurrent refresh, including a single credential fallback', async () => {
            vi.mocked(mockHttp.post)
                .mockResolvedValueOnce({ data: { errorCode: 0, result: { accessToken: 'old', refreshToken: 'refresh', expiresIn: 0 } } })
                .mockRejectedValueOnce(new Error('Refresh expired'))
                .mockResolvedValueOnce({ data: { errorCode: 0, result: { accessToken: 'new', expiresIn: 3600 } } });
            await authManager.getAccessToken();
            expect(await Promise.all(Array.from({ length: 5 }, () => authManager.getAccessToken()))).toEqual(Array(5).fill('new'));
            expect(mockHttp.post).toHaveBeenCalledTimes(3);
        });

        it('shares a successful refresh without repeated token calls', async () => {
            vi.mocked(mockHttp.post)
                .mockResolvedValueOnce({ data: { errorCode: 0, result: { accessToken: 'old', refreshToken: 'refresh', expiresIn: 0 } } })
                .mockResolvedValueOnce({ data: { errorCode: 0, result: { accessToken: 'new', expiresIn: 3600 } } });
            await authManager.getAccessToken();
            expect(await Promise.all(Array.from({ length: 5 }, () => authManager.getAccessToken()))).toEqual(Array(5).fill('new'));
            expect(mockHttp.post).toHaveBeenCalledTimes(2);
        });

        it('clears a failed shared login and allows a later retry', async () => {
            const failure = new Error('Controller unavailable');
            vi.mocked(mockHttp.post)
                .mockRejectedValueOnce(failure)
                .mockResolvedValueOnce({ data: { errorCode: 0, result: { accessToken: 'recovered', expiresIn: 3600 } } });
            const outcomes = await Promise.allSettled(Array.from({ length: 5 }, () => authManager.getAccessToken()));
            expect(outcomes).toEqual(Array(5).fill({ status: 'rejected', reason: failure }));
            expect(mockHttp.post).toHaveBeenCalledTimes(1);
            await expect(authManager.getAccessToken()).resolves.toBe('recovered');
            expect(mockHttp.post).toHaveBeenCalledTimes(2);
        });

        it('clears failed refresh and credential fallback so a later caller can recover', async () => {
            vi.mocked(mockHttp.post)
                .mockResolvedValueOnce({ data: { errorCode: 0, result: { accessToken: 'old', refreshToken: 'refresh', expiresIn: 0 } } })
                .mockRejectedValueOnce(new Error('Refresh failed'))
                .mockRejectedValueOnce(new Error('Credentials failed'))
                .mockResolvedValueOnce({ data: { errorCode: 0, result: { accessToken: 'recovered', expiresIn: 3600 } } });
            await authManager.getAccessToken();
            const outcomes = await Promise.allSettled([authManager.getAccessToken(), authManager.getAccessToken()]);
            expect(outcomes.every((outcome) => outcome.status === 'rejected')).toBe(true);
            expect(mockHttp.post).toHaveBeenCalledTimes(3);
            await expect(authManager.getAccessToken()).resolves.toBe('recovered');
            expect(mockHttp.post).toHaveBeenLastCalledWith('/openapi/authorize/token', expect.objectContaining({ omadacId }), {
                params: { grant_type: 'client_credentials' },
            });
        });

        it.each([
            {},
            { accessToken: '' },
            { accessToken: ' ' },
            { accessToken: 123 },
        ])('rejects malformed successful token %j and permits recovery', async (result) => {
            vi.mocked(mockHttp.post)
                .mockResolvedValueOnce({ data: { errorCode: 0, result } })
                .mockResolvedValueOnce({ data: { errorCode: 0, result: { accessToken: 'valid', expiresIn: 3600 } } });
            await expect(authManager.getAccessToken()).rejects.toThrow('no valid access token');
            await expect(authManager.getAccessToken()).resolves.toBe('valid');
        });

        it('surfaces generic authentication errors and non-Error transport failures', async () => {
            vi.mocked(mockHttp.post)
                .mockResolvedValueOnce({ data: { errorCode: -1 } })
                .mockRejectedValueOnce('transport failure');
            await expect(authManager.getAccessToken()).rejects.toThrow('Omada authentication failed');
            await expect(authManager.getAccessToken()).rejects.toBe('transport failure');
            expect(loggerModule.logger.error).toHaveBeenCalledWith(
                'Omada authentication failed',
                expect.objectContaining({ error: 'transport failure' })
            );
        });

        it('does not cache a token with a nonfinite expiry', async () => {
            vi.mocked(mockHttp.post).mockResolvedValue({ data: { errorCode: 0, result: { accessToken: 'valid', expiresIn: Number.NaN } } });
            await authManager.getAccessToken();
            await authManager.getAccessToken();
            expect(mockHttp.post).toHaveBeenCalledTimes(2);
        });
        it('shares a single authentication across concurrent cold callers', async () => {
            vi.mocked(mockHttp.post).mockResolvedValue({
                data: { errorCode: 0, result: { accessToken: 'shared', expiresIn: 3600 } },
            });
            expect(await Promise.all(Array.from({ length: 5 }, () => authManager.getAccessToken()))).toEqual(Array(5).fill('shared'));
            expect(mockHttp.post).toHaveBeenCalledTimes(1);
        });

        it('should authenticate and return access token on first call', async () => {
            const mockToken: TokenResult = {
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                expiresIn: 3600,
                tokenType: 'Bearer',
            };

            const mockResponse: OmadaApiResponse<TokenResult> = {
                errorCode: 0,
                msg: 'Success',
                result: mockToken,
            };

            (mockHttp.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockResponse });

            const token = await authManager.getAccessToken();

            expect(token).toBe('test-access-token');
            expect(mockHttp.post).toHaveBeenCalledWith(
                '/openapi/authorize/token',
                {
                    client_id: clientId,
                    client_secret: clientSecret,
                    omadacId: omadacId,
                },
                { params: { grant_type: 'client_credentials' } }
            );
        });

        it('should return cached token if still valid', async () => {
            const mockToken: TokenResult = {
                accessToken: 'cached-token',
                refreshToken: 'cached-refresh',
                expiresIn: 3600,
                tokenType: 'Bearer',
            };

            const mockResponse: OmadaApiResponse<TokenResult> = {
                errorCode: 0,
                msg: 'Success',
                result: mockToken,
            };

            (mockHttp.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockResponse });

            // First call to set token
            const token1 = await authManager.getAccessToken();
            expect(token1).toBe('cached-token');

            // Second call should use cached token
            const token2 = await authManager.getAccessToken();
            expect(token2).toBe('cached-token');
            expect(mockHttp.post).toHaveBeenCalledTimes(1); // Only called once
        });

        it('should refresh token when expired', async () => {
            const initialToken: TokenResult = {
                accessToken: 'initial-token',
                refreshToken: 'initial-refresh',
                expiresIn: 1, // Very short expiry
                tokenType: 'Bearer',
            };

            const refreshedToken: TokenResult = {
                accessToken: 'refreshed-token',
                refreshToken: 'refreshed-refresh',
                expiresIn: 3600,
                tokenType: 'Bearer',
            };

            const initialResponse: OmadaApiResponse<TokenResult> = {
                errorCode: 0,
                msg: 'Success',
                result: initialToken,
            };

            const refreshResponse: OmadaApiResponse<TokenResult> = {
                errorCode: 0,
                msg: 'Success',
                result: refreshedToken,
            };

            (mockHttp.post as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce({ data: initialResponse })
                .mockResolvedValueOnce({ data: refreshResponse });

            // First call
            await authManager.getAccessToken();

            // Wait for token to expire
            await new Promise((resolve) => setTimeout(resolve, 50));

            // Second call should refresh
            const token = await authManager.getAccessToken();

            expect(token).toBe('refreshed-token');
            expect(mockHttp.post).toHaveBeenCalledTimes(2);
            expect(mockHttp.post).toHaveBeenNthCalledWith(
                2,
                '/openapi/authorize/token',
                {
                    client_id: clientId,
                    client_secret: clientSecret,
                },
                { params: { grant_type: 'refresh_token', refresh_token: 'initial-refresh' } }
            );
        });

        it('should re-authenticate with client credentials if refresh fails', async () => {
            const initialToken: TokenResult = {
                accessToken: 'initial-token',
                refreshToken: 'initial-refresh',
                expiresIn: 1,
                tokenType: 'Bearer',
            };

            const newToken: TokenResult = {
                accessToken: 'new-token',
                refreshToken: 'new-refresh',
                expiresIn: 3600,
                tokenType: 'Bearer',
            };

            const initialResponse: OmadaApiResponse<TokenResult> = {
                errorCode: 0,
                msg: 'Success',
                result: initialToken,
            };

            const newResponse: OmadaApiResponse<TokenResult> = {
                errorCode: 0,
                msg: 'Success',
                result: newToken,
            };

            (mockHttp.post as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce({ data: initialResponse })
                .mockRejectedValueOnce(new Error('Refresh failed'))
                .mockResolvedValueOnce({ data: newResponse });

            // First call
            await authManager.getAccessToken();

            // Wait for token to expire
            await new Promise((resolve) => setTimeout(resolve, 50));

            // Second call should try refresh, fail, then use client_credentials
            const token = await authManager.getAccessToken();

            expect(token).toBe('new-token');
            expect(mockHttp.post).toHaveBeenCalledTimes(3);
        });

        it('should throw error if authentication fails', async () => {
            const errorResponse: OmadaApiResponse<TokenResult> = {
                errorCode: -1,
                msg: 'Authentication failed',
            };

            (mockHttp.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: errorResponse });

            await expect(authManager.getAccessToken()).rejects.toThrow('Authentication failed');
            expect(loggerModule.logger.error).toHaveBeenCalledWith(
                'Omada authentication error',
                expect.objectContaining({
                    errorCode: -1,
                    message: 'Authentication failed',
                })
            );
        });

        it('should throw error if HTTP request fails', async () => {
            (mockHttp.post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

            await expect(authManager.getAccessToken()).rejects.toThrow('Network error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith(
                'Omada authentication failed',
                expect.objectContaining({
                    grantType: 'client_credentials',
                    error: 'Network error',
                })
            );
        });

        it('should handle missing result in response', async () => {
            const mockResponse: OmadaApiResponse<TokenResult> = {
                errorCode: 0,
                msg: 'Success',
            };

            (mockHttp.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockResponse });

            await expect(authManager.getAccessToken()).rejects.toThrow('Omada authentication returned no valid access token');
        });

        it('should handle zero or negative expiresIn', async () => {
            const mockToken: TokenResult = {
                accessToken: 'test-token',
                refreshToken: 'test-refresh',
                expiresIn: 0,
                tokenType: 'Bearer',
            };

            const mockResponse: OmadaApiResponse<TokenResult> = {
                errorCode: 0,
                msg: 'Success',
                result: mockToken,
            };

            (mockHttp.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockResponse });

            const token = await authManager.getAccessToken();

            expect(token).toBe('test-token');
        });
    });

    describe('clearToken', () => {
        it('ignores delayed rejection of an old token after a replacement has been issued', async () => {
            vi.mocked(mockHttp.post)
                .mockResolvedValueOnce({ data: { errorCode: 0, result: { accessToken: 'old', expiresIn: 3600 } } })
                .mockResolvedValueOnce({ data: { errorCode: 0, result: { accessToken: 'new', expiresIn: 3600 } } });
            await authManager.getAccessToken();
            authManager.clearToken('old');
            await expect(authManager.getAccessToken()).resolves.toBe('new');
            authManager.clearToken('old');
            await expect(authManager.getAccessToken()).resolves.toBe('new');
            expect(mockHttp.post).toHaveBeenCalledTimes(2);
        });

        it('should clear all token state', async () => {
            const mockToken: TokenResult = {
                accessToken: 'test-token',
                refreshToken: 'test-refresh',
                expiresIn: 3600,
                tokenType: 'Bearer',
            };

            const mockResponse: OmadaApiResponse<TokenResult> = {
                errorCode: 0,
                msg: 'Success',
                result: mockToken,
            };

            (mockHttp.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockResponse });

            // Set a token
            await authManager.getAccessToken();
            expect(mockHttp.post).toHaveBeenCalledTimes(1);

            // Clear it
            authManager.clearToken();

            // Next call should re-authenticate
            await authManager.getAccessToken();
            expect(mockHttp.post).toHaveBeenCalledTimes(2);
        });
    });
});
