import type { OmadaSiteSummary } from '../types/index.js';

import type { RequestHandler } from './request.js';

/**
 * Site-related operations for the Omada API.
 */
export class SiteOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly buildPath: (path: string) => string,
        private readonly defaultSiteId?: string
    ) {}

    /**
     * List all sites accessible to the authenticated user.
     */
    public async listSites(): Promise<OmadaSiteSummary[]> {
        return await this.request.fetchPaginated<OmadaSiteSummary>(this.buildPath('/sites'));
    }

    /**
     * Resolve a site ID from the parameter or default configuration.
     * @throws {Error} If no site ID is available
     */
    public resolveSiteId(siteId?: string): string {
        if (siteId) {
            return siteId;
        }

        if (this.defaultSiteId) {
            return this.defaultSiteId;
        }

        throw new Error('A site id must be provided either in the environment or as a parameter.');
    }
}
