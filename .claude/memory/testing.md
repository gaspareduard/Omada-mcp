# Testing

## Framework
- **Vitest** (not Jest) — config in `vitest.config.ts`
- Coverage via `@vitest/coverage-v8`
- All test files: `tests/**/*.test.ts`

## Commands
```bash
npm test                  # run once
npm run test:watch        # watch mode
npm run test:coverage     # with coverage report
```

## Coverage Thresholds
- **Per file**: >90% on Lines, Branches, Functions, Statements
- **Project-wide**: >80% minimum
- Always run `npm run test:coverage` after changes and verify thresholds pass

## Directory Structure
- `tests/` **must mirror** `src/` exactly
  - `tests/config.test.ts` → `src/config.ts`
  - `tests/omadaClient/auth.test.ts` → `src/omadaClient/auth.ts`
  - `tests/server/http.test.ts` → `src/server/http.ts`
  - `tests/tools/listSites.test.ts` → `src/tools/listSites.ts`
  - `tests/utils/config-validations.test.ts` → `src/utils/config-validations.ts`

## Existing Test Files
```
tests/
  config.test.ts
  env.test.ts
  index.test.ts
  omadaClient/
    auth.test.ts, client.test.ts, device.test.ts, index.test.ts
    network.test.ts, request.test.ts, security.test.ts, site.test.ts
  server/
    common.test.ts, http.start.test.ts, http.test.ts
    stdio.test.ts, stream.test.ts
  tools/
    getDevice.test.ts, getDevicesStats.test.ts, getPortForwardingStatus.test.ts
    index.test.ts, listClients.test.ts, listDevices.test.ts, listSites.test.ts
    listTools.test.ts, networkTools.test.ts, searchDevices.test.ts
    securityAndWirelessTools.test.ts, simpleGetTools.test.ts
  utils/
    (config-validations tests are here)
```

## Mocking Approach
- Mock external dependencies (Omada API calls, HTTP) using Vitest's built-in mocking
- Do not make real HTTP calls in tests
- `vi.mock()` for module mocking, `vi.spyOn()` for method spying

## Config Validation Tests
- All Zod validators in `src/utils/config-validations.ts` must be tested in `tests/utils/`
- No validation logic outside `src/config.ts` and `src/utils/config-validations.ts`
- Test both valid and invalid inputs, including edge cases
