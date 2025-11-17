import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        env: {
            MCP_SERVER_LOG_LEVEL: 'silent',
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'json-summary', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.test.ts', 'src/types/**', 'src/types.ts', 'src/tools/types.ts'],
            reportOnFailure: true,
        },
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
    },
});
