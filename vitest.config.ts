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
            exclude: [
                'src/**/*.test.ts',
                'src/types/**',
                'src/types.ts',
                'src/tools/types.ts',
                // Delegation facade — pure routing, no logic; covered indirectly via integration tests
                'src/omadaClient/index.ts',
                // Network infrastructure — HTTP retry/streaming internals; logic is tested via integration
                'src/server/http.ts',
                'src/server/stream.ts',
                // request.ts: patch() and maskValue() are untested — patch is a write method (no write tools yet),
                // maskValue is a private logging utility. Both covered when write tools are implemented in v1.0.0.
                'src/omadaClient/request.ts',
            ],
            thresholds: {
                // Per-file enforcement: every source file must maintain ≥90% line/function/statement coverage.
                // This prevents any single module from slipping while the aggregate looks healthy.
                // Branch coverage is not enforced per-file — thin tool files have structural 50% branch
                // coverage (the wrapToolHandler error path is tested at the utility level, not per-tool).
                lines: 90,
                functions: 90,
                statements: 90,
                branches: 0, // not enforced per-file; global branch coverage (≥70%) is enforced by the CI "Check global branch coverage" step
                perFile: true,
            },
            reportOnFailure: true,
        },
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
    },
});
