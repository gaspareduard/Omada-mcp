import { z } from 'zod';

/**
 * Standard Omada API pagination parameters.
 * All paginated Omada API endpoints require both page and pageSize parameters.
 *
 * According to the API specification:
 * - page: Start page number. Start from 1. (required)
 * - pageSize: Number of entries per page. Range: 1-1000. (required)
 *
 * @param defaultPageSize - Default page size to use (default: 10)
 * @returns Zod object shape with page and pageSize fields
 */
export function createPaginationSchema(defaultPageSize = 10) {
    return {
        page: z.number().int().min(1).default(1).describe('Start page number. Start from 1.'),
        pageSize: z.number().int().min(1).max(1000).default(defaultPageSize).describe('Number of entries per page. Range: 1-1000.'),
    };
}

/**
 * Type representing the pagination parameters shape.
 */
export interface PaginationParams {
    page: number;
    pageSize: number;
}
