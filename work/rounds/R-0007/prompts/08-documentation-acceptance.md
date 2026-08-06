# Wave 8 — canonical handoff acceptance

## Agents

Spawn two fresh `gpt-5.6-sol` Inspector agents at `xhigh` with disjoint tests:

1. Enumeration/parity Inspector.
2. Usability/examples/migration Inspector.

## Required checks

Do not test or claim R-0009's complete narrative corpus or deploy-ready site. Test that the
canonical descriptors and migration/operator handoff are deterministic, complete, and usable
as the single source for that later documentation wave.

- Every canonical suite, preset, kind, slice, tier, executor kind, selection mode,
  runtime, rostered model, supported effort, role, effect, verdict, lifecycle, and
  surface tier is documented exactly once in its generated reference.
- No undocumented canonical value and no documented nonexistent value.
- Suite and preset memberships and order match runtime descriptors.
- Every sensor kind reports its actual prerequisites, cells/diagnostic standing, preset membership, and effect.
- Every inventory slice has a real implementation or an explicit unsupported/error contract.
- Every old command appears exactly once in the migration guide.
- All examples route successfully in dry-run/read-only fixtures or fail with the documented precondition.
- No current page uses F5 as user onboarding, `--allow-publish`, check profile, sense set, or tier names as sensor presets.
- Cross-links, anchors, generated-byte checks, spelling, and formatting pass.
- Documentation separates observation (`sense`) from acceptance (`check`) and tasks from rounds without contradiction.
- Documentation does not conflate model capability with governance authority, promise
  an unrostered model, imply fallback for `exact`, or omit requested-versus-resolved
  execution evidence.
- A new user can select the correct suite/preset/slice/kind from the overview without reading implementation docs.

Documentation defects return to the relevant Architect and invalidate prior docs acceptance.
