## Summary

<!-- What does this PR do? One paragraph. -->

## Type of change

- [ ] Bug fix
- [ ] New tool(s)
- [ ] Refactor / cleanup
- [ ] Documentation
- [ ] CI/CD

## Release readiness checklist

- [ ] `npm run check` passes (lint + typecheck)
- [ ] `npm run build` passes
- [ ] `npm run test:coverage` passes (per-file 90% threshold)
- [ ] `node scripts/check-tool-tests.mjs` passes (1:1 test file mirroring)
- [ ] `node scripts/check-readme-sync.mjs` passes (README tool table sync)
- [ ] New tools have a row in **both** `README.md` and `README.Docker.md`
- [ ] New env vars are documented in `.env.example` and both READMEs
- [ ] No credentials, secrets, or `docs/openapi/*.json` modifications
- [ ] API routes verified against `docs/openapi/` (not guessed)

## Testing notes

<!-- How was this manually tested? What Omada controller version? -->
