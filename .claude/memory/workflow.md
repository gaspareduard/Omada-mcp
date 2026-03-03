# Dev Workflow

## Commands
```bash
npm install               # install deps
npm run dev               # tsx watch mode (src/index.ts)
npm run build             # compile to dist/ (tsc)
npm run check             # lint + type check (biome + tsc --noEmit)
npm run lint              # biome lint only
npm run lint:fix          # biome lint --write
npm run format            # biome format --write (also fixes CRLF → LF)
npm test                  # vitest run
npm run test:watch        # vitest watch
npm run test:coverage     # vitest + v8 coverage
npm start                 # node dist/index.js (production)
```

## Docker
```bash
npm run docker:build      # build ghcr.io/migueltvms/tplink-omada-mcp:latest
npm run docker:run        # run with .env + .env.local
npm run docker:push       # push to GHCR
```

## Branching (GitFlow)
- `main` — production-ready only
- `develop` — integration branch, **all PRs target here**
- Feature branches: branch from `develop`, PR back to `develop`
- Never PR directly to `main`

## Before Committing
1. `npm run check` — lint + types must pass
2. `npm run build` — must compile cleanly
3. `npm test` — all tests must pass
4. `npm run test:coverage` — coverage thresholds must hold

## Environment Files
- `.env.example` — committed, template with all vars documented
- `.env.local` — local overrides, NOT committed (gitignored)
- Never commit real secrets

## Devcontainer
- Base: `mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm`
- Forwards ports: 8043, 8088, 3000
- `npm install` runs automatically on container create
- Extensions: `biomejs.biome`, `42Crunch.vscode-openapi`, `ardisaurus.gitflow-actions-sidebar`
