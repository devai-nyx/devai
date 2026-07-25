---
id: R-0008-EXTERNAL-AUTHORIZATION
title: External 1.0.0 release authorization gate
type: authorization
status: draft
date: 2026-07-24
authority: Owner
supersedes: null
superseded_by: null
provenance: [OM-002 explicit stop-before-external-release boundary]
---

# R-0008 external release authorization

**STATUS: PENDING**

The repository phase must place its exact candidate SHA, eleven tarball names/hashes,
attestation subjects, dry-run results, migration result, site-artifact hash, required
secrets-by-name, and remote-check URLs in the R-0008 handoff.

Only a later direct Owner instruction that identifies that candidate or explicitly
authorizes revalidation against a newer candidate may change this gate to GRANTED.
Without it, the orchestrator stops before:

- publishing any package;
- creating or pushing any tag;
- creating a GitHub Release;
- deploying GitHub Pages;
- claiming BL-020, BL-024, R-0008, or DEVAI 1.0.0 released.

Token checks are secret-safe: report presence/scope usability, never values.
