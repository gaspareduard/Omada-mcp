import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestHandler } from '../../src/omadaClient/request.js';
import { SiteOperations } from '../../src/omadaClient/site.js';
import type { OmadaSiteSummary } from '../../src/types/index.js';

describe('omadaClient/site', () => {
    let mockRequest: RequestHandler;
    let buildPath: (path: string) => string;

    beforeEach(() => {
        mockRequest = {
            fetchPaginated: vi.fn(),
            get: vi.fn(),
            ensureSuccess: vi.fn((response) => response?.result ?? response),
        } as unknown as RequestHandler;

        buildPath = (path: string) => `/api${path}`;
    });

    describe('SiteOperations', () => {
        describe('listSites', () => {
            it('should fetch paginated list of sites', async () => {
                const mockSites: OmadaSiteSummary[] = [
                    { siteId: 'site-1', name: 'Site 1' },
                    { siteId: 'site-2', name: 'Site 2' },
                ];

                (mockRequest.fetchPaginated as ReturnType<typeof vi.fn>).mockResolvedValue(mockSites);

                const siteOps = new SiteOperations(mockRequest, buildPath);
                const sites = await siteOps.listSites();

                expect(sites).toEqual(mockSites);
                expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/api/sites', {}, undefined);
            });
        });

        describe('resolveSiteId', () => {
            it('should return provided siteId parameter', () => {
                const siteOps = new SiteOperations(mockRequest, buildPath, 'default-site');
                const resolved = siteOps.resolveSiteId('param-site');

                expect(resolved).toBe('param-site');
            });

            it('should return default siteId if parameter not provided', () => {
                const siteOps = new SiteOperations(mockRequest, buildPath, 'default-site');
                const resolved = siteOps.resolveSiteId();

                expect(resolved).toBe('default-site');
            });

            it('should throw error if no siteId provided and no default', () => {
                const siteOps = new SiteOperations(mockRequest, buildPath);

                expect(() => siteOps.resolveSiteId()).toThrow('A site id must be provided either in the environment or as a parameter.');
            });

            it('should prefer parameter over default', () => {
                const siteOps = new SiteOperations(mockRequest, buildPath, 'default-site');
                const resolved = siteOps.resolveSiteId('param-site');

                expect(resolved).toBe('param-site');
            });

            it('should handle undefined parameter explicitly', () => {
                const siteOps = new SiteOperations(mockRequest, buildPath, 'default-site');
                const resolved = siteOps.resolveSiteId(undefined);

                expect(resolved).toBe('default-site');
            });

            it('should handle empty string parameter', () => {
                const siteOps = new SiteOperations(mockRequest, buildPath, 'default-site');

                // Empty string is falsy, so should use default
                const resolved = siteOps.resolveSiteId('');

                expect(resolved).toBe('default-site');
            });
        });

        describe('getSiteDetail', () => {
            it('should fetch site detail by siteId', async () => {
                const mockResult = { siteId: 'site-1', name: 'Site 1' };
                (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({ result: mockResult });
                (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockResult);

                const siteOps = new SiteOperations(mockRequest, buildPath, 'site-1');
                const result = await siteOps.getSiteDetail('site-1');

                expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1', undefined, undefined);
                expect(result).toEqual(mockResult);
            });

            it('should use default siteId when none provided', async () => {
                const mockResult = { siteId: 'default-site' };
                (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({ result: mockResult });
                (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockResult);

                const siteOps = new SiteOperations(mockRequest, buildPath, 'default-site');
                await siteOps.getSiteDetail();

                expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/default-site', undefined, undefined);
            });
        });

        describe('getSiteUrl', () => {
            it('should fetch site URL', async () => {
                const mockResult = { url: 'https://example.com' };
                (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({ result: mockResult });
                (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockResult);

                const siteOps = new SiteOperations(mockRequest, buildPath, 'site-1');
                const result = await siteOps.getSiteUrl('site-1');

                expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/url', undefined, undefined);
                expect(result).toEqual(mockResult);
            });
        });

        describe('getSiteNtpStatus', () => {
            it('should fetch site NTP status', async () => {
                const mockResult = { ntpServer: 'pool.ntp.org' };
                (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({ result: mockResult });
                (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockResult);

                const siteOps = new SiteOperations(mockRequest, buildPath, 'site-1');
                const result = await siteOps.getSiteNtpStatus('site-1');

                expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/setting/ntp', undefined, undefined);
                expect(result).toEqual(mockResult);
            });
        });

        describe('getSiteSpecification', () => {
            it('should fetch site specification', async () => {
                const mockResult = { maxClients: 100 };
                (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({ result: mockResult });
                (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockResult);

                const siteOps = new SiteOperations(mockRequest, buildPath, 'site-1');
                const result = await siteOps.getSiteSpecification('site-1');

                expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/specification', undefined, undefined);
                expect(result).toEqual(mockResult);
            });
        });

        describe('getSiteRememberSetting', () => {
            it('should fetch site remember device setting', async () => {
                const mockResult = { enable: true };
                (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({ result: mockResult });
                (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockResult);

                const siteOps = new SiteOperations(mockRequest, buildPath, 'site-1');
                const result = await siteOps.getSiteRememberSetting('site-1');

                expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/remember-device', undefined, undefined);
                expect(result).toEqual(mockResult);
            });
        });

        describe('getSiteDeviceAccount', () => {
            it('should fetch site device account setting', async () => {
                const mockResult = { username: 'admin' };
                (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({ result: mockResult });
                (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockResult);

                const siteOps = new SiteOperations(mockRequest, buildPath, 'site-1');
                const result = await siteOps.getSiteDeviceAccount('site-1');

                expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/device-account', undefined, undefined);
                expect(result).toEqual(mockResult);
            });
        });

        describe('getSiteCapacity', () => {
            it('should fetch site capacity', async () => {
                const mockResult = { apLimit: 50 };
                (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({ result: mockResult });
                (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockResult);

                const siteOps = new SiteOperations(mockRequest, buildPath, 'site-1');
                const result = await siteOps.getSiteCapacity('site-1');

                expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/capacity', undefined, undefined);
                expect(result).toEqual(mockResult);
            });
        });

        describe('getSiteTemplateList', () => {
            it('should fetch site template list', async () => {
                const mockResult = [{ id: 'tmpl-1', name: 'Template 1' }];
                (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({ result: mockResult });
                (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockResult);

                const siteOps = new SiteOperations(mockRequest, buildPath);
                const result = await siteOps.getSiteTemplateList();

                expect(mockRequest.get).toHaveBeenCalledWith('/api/sitetemplates', undefined, undefined);
                expect(result).toEqual(mockResult);
            });
        });

        describe('getSiteTemplateDetail', () => {
            it('should fetch site template detail by template ID', async () => {
                const mockResult = { id: 'tmpl-1', name: 'Template 1' };
                (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({ result: mockResult });
                (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockResult);

                const siteOps = new SiteOperations(mockRequest, buildPath);
                const result = await siteOps.getSiteTemplateDetail('tmpl-1');

                expect(mockRequest.get).toHaveBeenCalledWith('/api/sitetemplates/tmpl-1', undefined, undefined);
                expect(result).toEqual(mockResult);
            });
        });

        describe('getSiteTemplateConfig', () => {
            it('should fetch site template configuration', async () => {
                const mockResult = { wifiEnabled: true };
                (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({ result: mockResult });
                (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockResult);

                const siteOps = new SiteOperations(mockRequest, buildPath);
                const result = await siteOps.getSiteTemplateConfig('tmpl-1');

                expect(mockRequest.get).toHaveBeenCalledWith('/api/sitetemplates/tmpl-1/setting/configuration', undefined, undefined);
                expect(result).toEqual(mockResult);
            });
        });
    });
});
