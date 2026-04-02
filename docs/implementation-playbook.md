# Implementation Playbook

## Coding rules

- Prefer official Open API endpoints documented in the shipped spec snapshots and TP-Link docs.
- Keep runtime paths explicit and typed.
- Avoid adding broad escape hatches to “make a feature easy”.

## Tool template

Every new tool should include:

1. a typed MCP input schema
2. category and permission assignment
3. risk classification
4. tests for operation layer, client passthrough, and tool registration
5. documentation row in `README.md` and `README.Docker.md`

## API validation checklist

1. Confirm the endpoint exists in the official docs or local spec snapshot.
2. Confirm the controller/site scope.
3. Confirm the payload shape and response shape.
4. Document any gaps or assumptions with a source link.

## Mutation safety checklist

1. Support `dryRun` if the action is operator-triggered and previewable.
2. Emit a mutation audit summary.
3. Validate identifiers and allowed values before sending the request.
4. Keep high-blast-radius tools behind a stricter category/profile.

## Test requirements

- Read tools: operation + tool registration tests
- Low-risk writes: operation + tool registration + mutation summary tests
- Admin writes: add explicit validation and conflict/error-path tests
