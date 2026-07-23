---
title: CLI information architecture and fail-closed routing
status: accepted
decision: D-129
---

# CLI information architecture and fail-closed routing

## Context

DEVAI 0.4 exposed 162 actions as flat CAC commands and simulated noun/verb syntax with a hand-maintained first-token list. Root help exceeded 300 lines, noun help could not narrow the surface, several documented spaced commands silently did nothing, and unknown commands exited successfully. The capabilities were coherent, but their public information architecture was not safe for automation or approachable for adopters.

## Decision

DEVAI 0.5 has one canonical, arbitrary-depth, space-separated command tree derived from the action registry. The public domains are adoption, specification, inventory, sensing, policy, governance, supervised work, evidence, agent runtime, release, documentation, catalog, and explicitly isolated experimental execution. CAC remains the leaf parser; a registry-derived dispatcher resolves the public path to an internal leaf identifier.

Every action publishes its canonical path, previous 0.4 name, authority, lifecycle, lifecycle reason, promotion criteria, visibility, applicable adoption profiles, and effect classification. Root and domain help use progressive disclosure. Unknown or incomplete commands exit 2 before action, LLM, evidence, filesystem, or network execution.

No compatibility aliases are retained. The project is pre-1.0 and prioritizes one honest contract over parallel command dialects. The generated migration inventory is the authoritative old-to-new map for adopter agents.

Routine append-only harness observations are classified `harness-write` and remain available without `--write`. Mutations to adopter or project substrates require `--write`; remote publication requires `--write --allow-publish`.

## Consequences

Adopters must migrate scripts, CI workflows, prompts, runbooks, and evidence policies when upgrading from 0.4. The complete CLI reference and migration inventory are generated from the same runtime registry, preventing help/documentation drift. Individual sensor capabilities remain available, but discovery follows substrate and property hierarchy.

## Promotion and review

The experimental autonomous loop remains under `devai experimental loop run` and retains D-126 activation and containment requirements. CLI organization does not promote autonomous execution.
