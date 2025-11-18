import pino from 'pino';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initLogger, logger } from '../../src/utils/logger.ts';

describe('logger', () => {
    let mockStdout: string[];
    let mockStderr: string[];
    let originalWrite: typeof process.stdout.write;
    let originalErrWrite: typeof process.stderr.write;

    beforeEach(() => {
        mockStdout = [];
        mockStderr = [];

        // Mock stdout and stderr to capture logs
        originalWrite = process.stdout.write;
        originalErrWrite = process.stderr.write;

        process.stdout.write = vi.fn((chunk: unknown) => {
            mockStdout.push(String(chunk));
            return true;
        }) as typeof process.stdout.write;

        process.stderr.write = vi.fn((chunk: unknown) => {
            mockStderr.push(String(chunk));
            return true;
        }) as typeof process.stderr.write;
    });

    afterEach(() => {
        process.stdout.write = originalWrite;
        process.stderr.write = originalErrWrite;
        vi.restoreAllMocks();
    });

    describe('initLogger', () => {
        it('should initialize logger with debug level', () => {
            initLogger('debug', 'json');
            logger.debug('test debug message');

            const logs = mockStdout.join('');
            expect(logs).toContain('test debug message');
            expect(logs).toContain('"level":20'); // Pino debug level
        });

        it('should initialize logger with info level', () => {
            initLogger('info', 'json');
            logger.debug('should not appear');
            logger.info('test info message');

            const logs = mockStdout.join('');
            expect(logs).not.toContain('should not appear');
            expect(logs).toContain('test info message');
            expect(logs).toContain('"level":30'); // Pino info level
        });

        it('should initialize logger with warn level', () => {
            initLogger('warn', 'json');
            logger.info('should not appear');
            logger.warn('test warn message');

            const logs = mockStdout.join('');
            expect(logs).not.toContain('should not appear');
            expect(logs).toContain('test warn message');
            expect(logs).toContain('"level":40'); // Pino warn level
        });

        it('should initialize logger with error level', () => {
            initLogger('error', 'json');
            logger.warn('should not appear');
            logger.error('test error message');

            const logs = mockStdout.join('');
            expect(logs).not.toContain('should not appear');
            expect(logs).toContain('test error message');
            expect(logs).toContain('"level":50'); // Pino error level
        });

        it('should initialize logger with plain format', () => {
            initLogger('info', 'plain');
            logger.info('test plain message');

            const logs = mockStdout.join('');
            expect(logs).toContain('test plain message');
            expect(logs).toContain('"level":"INFO"');
        });

        it('should initialize logger with json format', () => {
            initLogger('info', 'json');
            logger.info('test json message');

            const logs = mockStdout.join('');
            expect(logs).toContain('test json message');
            expect(logs).toMatch(/"level":\d+/); // Pino numeric level
        });

        it('should initialize logger with gcp-json format', () => {
            initLogger('info', 'gcp-json');
            logger.info('test gcp message');

            const logs = mockStdout.join('');
            expect(logs).toContain('test gcp message');
            expect(logs).toContain('"severity":"INFO"');
        });

        it('should log to stderr when useStderr is true', () => {
            initLogger('info', 'json', true);
            logger.info('test stderr message');

            expect(mockStdout.join('')).toBe('');
            const stderrLogs = mockStderr.join('');
            expect(stderrLogs).toContain('test stderr message');
        });

        it('should log to stdout when useStderr is false', () => {
            initLogger('info', 'json', false);
            logger.info('test stdout message');

            expect(mockStderr.join('')).toBe('');
            const stdoutLogs = mockStdout.join('');
            expect(stdoutLogs).toContain('test stdout message');
        });
    });

    describe('logger methods', () => {
        beforeEach(() => {
            initLogger('debug', 'json');
        });

        it('should log debug messages', () => {
            logger.debug('debug test');

            const logs = mockStdout.join('');
            expect(logs).toContain('debug test');
        });

        it('should log info messages', () => {
            logger.info('info test');

            const logs = mockStdout.join('');
            expect(logs).toContain('info test');
        });

        it('should log warn messages', () => {
            logger.warn('warn test');

            const logs = mockStdout.join('');
            expect(logs).toContain('warn test');
        });

        it('should log error messages', () => {
            logger.error('error test');

            const logs = mockStdout.join('');
            expect(logs).toContain('error test');
        });

        it('should log messages with metadata', () => {
            logger.info('test with meta', { userId: '123', action: 'login' });

            const logs = mockStdout.join('');
            expect(logs).toContain('test with meta');
            expect(logs).toContain('"userId":"123"');
            expect(logs).toContain('"action":"login"');
        });

        it('should handle Error objects in metadata', () => {
            const testError = new Error('test error');
            logger.error('error occurred', { error: testError });

            const logs = mockStdout.join('');
            expect(logs).toContain('error occurred');
            expect(logs).toContain('"message":"test error"');
            expect(logs).toContain('"stack"');
        });

        it('should handle empty metadata', () => {
            logger.info('test without meta', {});

            const logs = mockStdout.join('');
            expect(logs).toContain('test without meta');
        });

        it('should handle undefined metadata', () => {
            logger.info('test no meta');

            const logs = mockStdout.join('');
            expect(logs).toContain('test no meta');
        });

        it('should handle complex metadata objects', () => {
            logger.info('complex meta', {
                nested: { key: 'value' },
                array: [1, 2, 3],
                number: 42,
                boolean: true,
            });

            const logs = mockStdout.join('');
            expect(logs).toContain('complex meta');
            expect(logs).toContain('"nested"');
            expect(logs).toContain('"array"');
            expect(logs).toContain('"number":42');
            expect(logs).toContain('"boolean":true');
        });
    });

    describe('GCP severity mapping', () => {
        beforeEach(() => {
            initLogger('debug', 'gcp-json');
        });

        it('should map debug to DEBUG severity', () => {
            logger.debug('debug message');

            const logs = mockStdout.join('');
            expect(logs).toContain('"severity":"DEBUG"');
        });

        it('should map info to INFO severity', () => {
            logger.info('info message');

            const logs = mockStdout.join('');
            expect(logs).toContain('"severity":"INFO"');
        });

        it('should map warn to WARNING severity', () => {
            logger.warn('warn message');

            const logs = mockStdout.join('');
            expect(logs).toContain('"severity":"WARNING"');
        });

        it('should map error to ERROR severity', () => {
            logger.error('error message');

            const logs = mockStdout.join('');
            expect(logs).toContain('"severity":"ERROR"');
        });
    });
});
