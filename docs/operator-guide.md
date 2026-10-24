# Operator Guide

## Safe startup

1. Set Omada credentials through environment variables.
2. Keep `OMADA_STRICT_SSL=true`; supply `OMADA_CA_FILE` for a private CA.
3. Start with `OMADA_CAPABILITY_PROFILE=safe-read`.
4. Expand to `ops-write` only when the operator intends to use low-risk actions.

## Unsafe HTTP mode

HTTP mode is intentionally unsupported for the safe baseline. It can only be enabled with `MCP_UNSAFE_ENABLE_HTTP=true`, and that should be limited to isolated lab testing.

## Mutation behavior

- Writes default to `dryRun=true`. Apply requires explicit `dryRun=false`.
- Review the structured mutation summary before allowing broader use.
- Keep a controller/site ownership map outside the repo so operators know which site is in scope.

## Upgrade policy

- Re-run unit tests and release-readiness checks before promoting a new build.
- Re-validate controller version compatibility when Omada updates API behavior.
- Follow the [0.19 migration guide](operations/0.19-migration.md); stable writes require disposable-lab evidence.
