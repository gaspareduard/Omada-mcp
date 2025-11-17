import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'json-summary', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.test.ts', 'src/types/**', 'src/types.ts', 'src/tools/types.ts'],
        },
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
    },
});
