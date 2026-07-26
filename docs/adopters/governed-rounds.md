# Governed rounds

A governed round is DEVAI's supported, human-supervised unit for planning,
role-separated execution, verification, and durable closure. It is not the
experimental autonomous loop.

## Scratch and archive layout

`devai init` and `devai adopt upgrade` establish two distinct surfaces:

- `docs/work/round-N/` is local scratch. It is gitignored and must never be
  committed or cited as durable authority.
- `docs/meta/rounds/round-N/` is the permanent closed dossier. It contains the
  schema-valid `record.md`, the plan, attributed audit observations, prompt
  logs, and `MANIFEST.json` hashes.

The `.devai/local/` tree remains disposable runtime state. Neither ignored
surface can establish a readiness claim.

## Supported ceremony

1. An Owner supplies the goal and an Architect records the declaring decision.
2. The Architect runs `devai round scaffold --round N --write`, fills the local
   plan, and declares a public-schema-valid record with
   `devai round declare --round N --record <record.json> --write`.
3. Each wave runs under its declared human role, lock scopes, and gates. Role
   boundaries remain separate commits.
4. `devai round status --round N` reports the schema-valid local state without
   mutation.
5. After the close decision, phase-closure record, phase-ledger entry, and every
   binding gate are present, the Architect runs
   `devai round archive --round N --write`.
6. Archive fails closed on any missing precondition. On success it moves the
   complete local dossier into `docs/meta/rounds/round-N/`, hashes every
   artifact, and stages the durable archive.

Auditor files are authored only in the local round's `audit/` directory and
retain Auditor attribution when the whole dossier is first committed at
archive. Prompt logs follow the same first-commit rule.

## Supported versus experimental

`round scaffold`, `round declare`, `round status`, and `round archive` are
supported deterministic governance primitives. They organize explicitly
human-actuated work; they do not choose work, write implementation autonomously,
merge, push, or publish.

`devai experimental loop run` remains a separate experimental controller. It
requires project opt-in plus invocation-level `--experimental --write`, stops at
human review, and cannot contribute supported readiness evidence. Adoption
profiles do not activate it.

## Decision records

Decision records remain direct Architect work. No agent skill may claim a wildcard
write scope under `law/adr/` or `law/register/`. An Architect selects the next
collision-free identity, authors the proposed record under the governed law surface,
and applies the normal review and decision lifecycle; creating a file never accepts it.

The canonical navigation surfaces are the
[decision-record index](../../law/adr/README.md) and
[closed-round ledger](../dev/round-ledger.md). The frozen pre-v1 monoliths remain
available under [`docs/meta/archive/pre-v1/`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/meta/archive/pre-v1/).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/governed-rounds.md (classification CURRENT).
