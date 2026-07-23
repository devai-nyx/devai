# Security policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately to the repository owner or security contact rather than opening a public issue. Include the affected version, reproduction conditions, impact, and any evidence that can be shared safely. Do not include live credentials, personal data, or exploit material in public logs or DEVAI evidence records.

## Supported versions

Security fixes target the current pre-1.0 development line — the latest published 0.x minor (see `CHANGELOG.md` for the current version). Older pre-1.0 releases may receive a migration note but are not guaranteed a backport. This wording is deliberately version-free: the hardcoded "0.4.x" it replaces had gone stale by a full minor before an external audit caught it (R18, D-133).

## Security boundary

DEVAI mechanically enforces authority, lifecycle, consent, and path policies for operations executed through its CLI/runtime. Arbitrary shell commands, editors, and host-agent file tools are outside that guarantee unless the adopter declares `authority_enforcement.mode: "host-integrated"` and supplies a verified adapter that intercepts those operations.

The autonomous loop is experimental. Mutation requires project opt-in plus `--experimental --write`; it cannot merge, push, complete a task, delete a branch, or destroy its recoverable worktree. Experimental evidence cannot establish supported production readiness.

## Secret handling

Secrets must enter through environment or host credential stores, never CLI arguments or committed configuration. `devai db start-shared` accepts its password only through `DEVAI_DB_PASSWORD` and emits a redacted connection URL. GitHub Packages reads require an authenticated `read:packages` token; never commit npm credentials.

See [secret handling](docs/meta/security/secret-handling.md), [authority enforcement](docs/meta/security/authority-enforcement.md), and the [threat model](docs/meta/security/threat-model.md) for the detailed controls and residual risks.
