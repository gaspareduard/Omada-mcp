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
    });
});
