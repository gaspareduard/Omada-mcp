import { describe, expect, it } from 'vitest';
import {
    clientIdSchema,
    customRequestSchema,
    deviceIdSchema,
    safeSerialize,
    siteInputSchema,
    stackIdSchema,
    toToolResult,
} from '../../src/server/common.js';

describe('server/common', () => {
    describe('toToolResult', () => {
        it('should convert string to tool result', () => {
            const result = toToolResult('test string');

            expect(result).toEqual({
                content: [{ type: 'text', text: 'test string' }],
            });
        });

        it('should convert object to formatted JSON string', () => {
            const obj = { key: 'value', nested: { data: 123 } };
            const result = toToolResult(obj);

            expect(result).toEqual({
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(obj, null, 2),
                    },
                ],
            });
        });

        it('should convert array to formatted JSON string', () => {
            const arr = [1, 2, 3];
            const result = toToolResult(arr);

            expect(result).toEqual({
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(arr, null, 2),
                    },
                ],
            });
        });

        it('should handle null', () => {
            const result = toToolResult(null);

            expect(result).toEqual({
                content: [{ type: 'text', text: 'null' }],
            });
        });

        it('should handle undefined', () => {
            const result = toToolResult(undefined);

            expect(result).toEqual({
                content: [],
            });
        });

        it('should handle empty string', () => {
            const result = toToolResult('');

            expect(result).toEqual({
                content: [],
            });
        });

        it('should handle numbers', () => {
            const result = toToolResult(123);

            expect(result).toEqual({
                content: [{ type: 'text', text: '123' }],
            });
        });

        it('should handle booleans', () => {
            const result = toToolResult(true);

            expect(result).toEqual({
                content: [{ type: 'text', text: 'true' }],
            });
        });
    });

    describe('safeSerialize', () => {
        it('should serialize simple objects', () => {
            const obj = { key: 'value' };
            expect(safeSerialize(obj)).toBe(JSON.stringify(obj));
        });

        it('should serialize arrays', () => {
            const arr = [1, 2, 3];
            expect(safeSerialize(arr)).toBe(JSON.stringify(arr));
        });

        it('should serialize strings', () => {
            expect(safeSerialize('test')).toBe('"test"');
        });

        it('should serialize numbers', () => {
            expect(safeSerialize(123)).toBe('123');
        });

        it('should serialize null', () => {
            expect(safeSerialize(null)).toBe('null');
        });

        it('should handle circular references', () => {
            const obj: { self?: unknown } = {};
            obj.self = obj;

            expect(safeSerialize(obj)).toBe('[unserializable]');
        });
    });

    describe('schema validations', () => {
        describe('siteInputSchema', () => {
            it('should accept valid siteId', () => {
                const result = siteInputSchema.safeParse({ siteId: 'site-123' });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.siteId).toBe('site-123');
                }
            });

            it('should accept empty object', () => {
                const result = siteInputSchema.safeParse({});
                expect(result.success).toBe(true);
            });

            it('should reject empty siteId', () => {
                const result = siteInputSchema.safeParse({ siteId: '' });
                expect(result.success).toBe(false);
            });
        });

        describe('clientIdSchema', () => {
            it('should accept valid clientId and siteId', () => {
                const result = clientIdSchema.safeParse({ clientId: 'client-123', siteId: 'site-123' });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.clientId).toBe('client-123');
                    expect(result.data.siteId).toBe('site-123');
                }
            });

            it('should accept valid clientId without siteId', () => {
                const result = clientIdSchema.safeParse({ clientId: 'client-123' });
                expect(result.success).toBe(true);
            });

            it('should reject missing clientId', () => {
                const result = clientIdSchema.safeParse({});
                expect(result.success).toBe(false);
            });

            it('should reject empty clientId', () => {
                const result = clientIdSchema.safeParse({ clientId: '' });
                expect(result.success).toBe(false);
            });
        });

        describe('deviceIdSchema', () => {
            it('should accept valid deviceId and siteId', () => {
                const result = deviceIdSchema.safeParse({ deviceId: 'device-123', siteId: 'site-123' });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.deviceId).toBe('device-123');
                    expect(result.data.siteId).toBe('site-123');
                }
            });

            it('should accept valid deviceId without siteId', () => {
                const result = deviceIdSchema.safeParse({ deviceId: 'device-123' });
                expect(result.success).toBe(true);
            });

            it('should reject missing deviceId', () => {
                const result = deviceIdSchema.safeParse({});
                expect(result.success).toBe(false);
            });

            it('should reject empty deviceId', () => {
                const result = deviceIdSchema.safeParse({ deviceId: '' });
                expect(result.success).toBe(false);
            });
        });

        describe('customRequestSchema', () => {
            it('should accept minimal valid request', () => {
                const result = customRequestSchema.safeParse({ url: '/api/test' });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.method).toBe('GET');
                    expect(result.data.url).toBe('/api/test');
                }
            });

            it('should accept full request with all fields', () => {
                const result = customRequestSchema.safeParse({
                    method: 'POST',
                    url: '/api/test',
                    params: { key: 'value' },
                    data: { body: 'data' },
                    siteId: 'site-123',
                });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.method).toBe('POST');
                    expect(result.data.url).toBe('/api/test');
                    expect(result.data.params).toEqual({ key: 'value' });
                    expect(result.data.data).toEqual({ body: 'data' });
                    expect(result.data.siteId).toBe('site-123');
                }
            });

            it('should reject missing url', () => {
                const result = customRequestSchema.safeParse({ method: 'GET' });
                expect(result.success).toBe(false);
            });

            it('should reject empty url', () => {
                const result = customRequestSchema.safeParse({ url: '' });
                expect(result.success).toBe(false);
            });

            it('should default method to GET', () => {
                const result = customRequestSchema.safeParse({ url: '/api/test' });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.method).toBe('GET');
                }
            });
        });

        describe('stackIdSchema', () => {
            it('should accept valid stackId and siteId', () => {
                const result = stackIdSchema.safeParse({ stackId: 'stack-123', siteId: 'site-123' });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.stackId).toBe('stack-123');
                    expect(result.data.siteId).toBe('site-123');
                }
            });

            it('should accept valid stackId without siteId', () => {
                const result = stackIdSchema.safeParse({ stackId: 'stack-123' });
                expect(result.success).toBe(true);
            });

            it('should reject missing stackId', () => {
                const result = stackIdSchema.safeParse({});
                expect(result.success).toBe(false);
            });

            it('should reject empty stackId', () => {
                const result = stackIdSchema.safeParse({ stackId: '' });
                expect(result.success).toBe(false);
            });
        });
    });
});
