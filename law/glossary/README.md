---
id: GLOSSARY-README
title: Glossary — joint-tier vocabulary index
type: index
status: draft
date: 2026-07-23
authority: Owner + Architect (joint — the single declared authority exception inside law/)
supersedes: null
superseded_by: null
provenance: [ex-glossary@devai-original (37 entries, all schema-valid per REV-0006); W01 vocabulary pass pending — successor terms (work/, record/, epochs, DII) to be added, retired terms tombstoned, GE-016 autonomy caveat, GE-006/020/022 path markings]
---

# Glossary

**Authority:** Owner and Architect, jointly (Constitution Article 6).

This directory holds glossary entries — canonical terms with definitions, cross-references, and the Owner or Architect anchor that introduces each term. Glossary entries are validated by `devai spec validate glossary` (Phase 2) for duplicate terms and undefined cross-references. The Phase-3 `devai inventory glossary` tool measures term coverage across F1 and F2.

## Index (Phase 13.B)

37 entries shipped as part of Phase 13.B (the self-application closure: DEVAI ships a glossary validator and finally eats its own dogfood).

| Group | IDs | Terms |
|---|---|---|
| Roles (Article 6 / D-3) | GE-001..005 | Owner, Architect, Engineer, Inspector, Auditor |
| Substrates (D-2) | GE-006..010 | F1, F2, F3, F4, F5 |
| Loop concepts | GE-011..018 | Sensor, SensorReading, Triage, Scorecard, Assessment, Backlog, Task, RGR |
| Governance artifacts | GE-019..025 | Invariant, Trace, Evidence chain, ADR, Tombstone, Inv-Compliance trailer, Agent-run |
| Severity ladder + override + project type | GE-026..028 | Severity ladder, inv-override, Project type |
| Phase-11 mechanisms | GE-029..033 | CNL, Adherence-reverse, Runtime probe, Release gate, Release control record |
| Phase-12 mechanism | GE-034 | RTD manifest |
| Bonus governance terms | GE-035..037 | Forbidden action, Skill manifest, Prompt firewall |

Each entry validates against `glossary-entry.schema.json`. Cross-references in `see_also` and `related_invariants` are checked at validation time.

## Authoring new entries

Use the next available `GE-NNN` number. Required fields per `glossary-entry.schema.json`: `schemaVersion`, `id`, `term`, `definition`, `authority` (`owner | architect | joint`), `status` (`draft | active | deprecated | retired`). Optional: `aliases`, `category`, `see_also`, `related_invariants`, `examples`, `counterexamples`.

Authority guidance:

- `owner` — business-tier terms (acceptance criteria, billing rules).
- `architect` — engineering-tier terms (schemas, invariants, mechanisms).
- `joint` — role names, substrates, terms that span tiers.

Definitions must be **closed-world**: no "usually", no "typically". If a term has multiple senses, split into separate entries with distinct IDs.

## Retiring entries

To retire a term, change its `status` to `retired` and leave the file in place. Do **not** delete it (the ID still appears in commit history and may be cited from old PRs). If the term is being renamed, retire the old entry and add a new one with the new term + an `aliases` entry pointing back.
