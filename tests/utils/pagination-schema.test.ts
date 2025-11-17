import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createPaginationSchema } from '../../src/utils/pagination-schema.js';

describe('pagination-schema', () => {
    describe('createPaginationSchema', () => {
        it('should create a valid pagination schema with default page size', () => {
            const schema = z.object(createPaginationSchema());

            // Valid pagination
            expect(schema.parse({ page: 1, pageSize: 10 })).toEqual({ page: 1, pageSize: 10 });
            expect(schema.parse({ page: 5, pageSize: 100 })).toEqual({ page: 5, pageSize: 100 });
        });

        it('should use default values when fields are not provided', () => {
            const schema = z.object(createPaginationSchema());

            const result = schema.parse({});
            expect(result).toEqual({ page: 1, pageSize: 10 });
        });

        it('should use custom default page size', () => {
            const schema = z.object(createPaginationSchema(50));

            const result = schema.parse({});
            expect(result).toEqual({ page: 1, pageSize: 50 });
        });

        it('should allow page size up to 1000', () => {
            const schema = z.object(createPaginationSchema());

            const result = schema.parse({ page: 1, pageSize: 1000 });
            expect(result).toEqual({ page: 1, pageSize: 1000 });
        });

        it('should reject page less than 1', () => {
            const schema = z.object(createPaginationSchema());

            expect(() => schema.parse({ page: 0, pageSize: 10 })).toThrow();
            expect(() => schema.parse({ page: -1, pageSize: 10 })).toThrow();
        });

        it('should reject pageSize less than 1', () => {
            const schema = z.object(createPaginationSchema());

            expect(() => schema.parse({ page: 1, pageSize: 0 })).toThrow();
            expect(() => schema.parse({ page: 1, pageSize: -10 })).toThrow();
        });

        it('should reject pageSize greater than 1000', () => {
            const schema = z.object(createPaginationSchema());

            expect(() => schema.parse({ page: 1, pageSize: 1001 })).toThrow();
            expect(() => schema.parse({ page: 1, pageSize: 5000 })).toThrow();
        });

        it('should reject non-integer page values', () => {
            const schema = z.object(createPaginationSchema());

            expect(() => schema.parse({ page: 1.5, pageSize: 10 })).toThrow();
            expect(() => schema.parse({ page: 2.99, pageSize: 10 })).toThrow();
        });

        it('should reject non-integer pageSize values', () => {
            const schema = z.object(createPaginationSchema());

            expect(() => schema.parse({ page: 1, pageSize: 10.5 })).toThrow();
            expect(() => schema.parse({ page: 1, pageSize: 99.99 })).toThrow();
        });

        it('should reject non-numeric page values', () => {
            const schema = z.object(createPaginationSchema());

            expect(() => schema.parse({ page: '1', pageSize: 10 })).toThrow();
            expect(() => schema.parse({ page: null, pageSize: 10 })).toThrow();
            // Note: undefined uses default value, so it doesn't throw
        });

        it('should reject non-numeric pageSize values', () => {
            const schema = z.object(createPaginationSchema());

            expect(() => schema.parse({ page: 1, pageSize: '10' })).toThrow();
            expect(() => schema.parse({ page: 1, pageSize: null })).toThrow();
            // Note: undefined uses default value, so it doesn't throw
        });
        it('should work when combined with other schema fields', () => {
            const schema = z.object({
                siteId: z.string().optional(),
                ...createPaginationSchema(20),
                searchKey: z.string().optional(),
            });

            const result = schema.parse({
                siteId: 'site123',
                searchKey: 'test',
            });

            expect(result).toEqual({
                siteId: 'site123',
                page: 1,
                pageSize: 20,
                searchKey: 'test',
            });
        });

        it('should preserve field descriptions', () => {
            const paginationFields = createPaginationSchema();

            expect(paginationFields.page.description).toBe('Start page number. Start from 1.');
            expect(paginationFields.pageSize.description).toBe('Number of entries per page. Range: 1-1000.');
        });

        it('should handle edge cases at boundaries', () => {
            const schema = z.object(createPaginationSchema());

            // Minimum valid values
            expect(schema.parse({ page: 1, pageSize: 1 })).toEqual({ page: 1, pageSize: 1 });

            // Maximum valid pageSize
            expect(schema.parse({ page: 1, pageSize: 1000 })).toEqual({ page: 1, pageSize: 1000 });

            // Large page number (should be valid)
            expect(schema.parse({ page: 999999, pageSize: 10 })).toEqual({ page: 999999, pageSize: 10 });
        });

        it('should work with different default page sizes', () => {
            const schema10 = z.object(createPaginationSchema(10));
            const schema50 = z.object(createPaginationSchema(50));
            const schema100 = z.object(createPaginationSchema(100));

            expect(schema10.parse({})).toEqual({ page: 1, pageSize: 10 });
            expect(schema50.parse({})).toEqual({ page: 1, pageSize: 50 });
            expect(schema100.parse({})).toEqual({ page: 1, pageSize: 100 });
        });
    });
});
