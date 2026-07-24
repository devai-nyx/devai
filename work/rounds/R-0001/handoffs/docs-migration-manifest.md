# P3 documentation migration manifest

- Final predecessor pin: `d76cd12d2241a1a28a32a0fe629c6531da7fe74d`
- Audit roster pin: `5eb78e453d854fc1f93a6976ab31c57900a74bff`
- Audit roster: 164 CURRENT, 5 STALE, 12 DUPLICATE, 11 HISTORICAL, 8 machinery
- Final-pin roster drift: `docs/index.md` removed; four pages added
  (`governed-rounds.md`, `phase-ledger.md`, `meta/rounds.md`,
  `sensor-registry.md`). The two ledger/index pages remain generated
  machinery; the two content pages import as CURRENT.
- Binding caveat: the genesis attestation remains PROVISIONAL pre-freeze.

| Predecessor path | Classification | Successor disposition |
|---|---|---|
| `docs/adopters/CONVENTIONS.md` | CURRENT | migrated to docs/adopters/CONVENTIONS.md |
| `docs/adopters/README.md` | CURRENT | migrated to docs/adopters/README.md |
| `docs/adopters/adoption-profiles.md` | CURRENT | migrated to docs/adopters/adoption-profiles.md |
| `docs/adopters/adoption.md` | CURRENT | migrated to docs/adopters/adoption.md |
| `docs/adopters/adr/README.md` | CURRENT | migrated to docs/adopters/adr/README.md |
| `docs/adopters/adr/TEMPLATE.md` | CURRENT | migrated to docs/adopters/adr/TEMPLATE.md |
| `docs/adopters/blueprint-authoring.md` | CURRENT | migrated to docs/adopters/blueprint-authoring.md |
| `docs/adopters/build-plan-convention.md` | CURRENT | migrated to docs/adopters/build-plan-convention.md |
| `docs/adopters/ci-economy.md` | CURRENT | migrated to docs/adopters/ci-economy.md |
| `docs/adopters/common-pitfalls.md` | CURRENT | migrated to docs/adopters/common-pitfalls.md |
| `docs/adopters/contracts/README.md` | CURRENT | migrated to docs/adopters/contracts/README.md |
| `docs/adopters/contracts/TEMPLATE.md` | CURRENT | migrated to docs/adopters/contracts/TEMPLATE.md |
| `docs/adopters/database-layout.md` | CURRENT | migrated to docs/adopters/database-layout.md |
| `docs/adopters/decisions-ledger.md` | CURRENT | migrated to docs/adopters/decisions-ledger.md |
| `docs/adopters/devai-r13-closeout.md` | HISTORICAL | not imported; frozen predecessor only |
| `docs/adopters/docs-layout.md` | CURRENT | migrated to docs/adopters/docs-layout.md |
| `docs/adopters/first-introspection.md` | CURRENT | migrated to docs/adopters/first-introspection.md |
| `docs/adopters/index.md` | CURRENT | migrated to docs/adopters/index.md |
| `docs/adopters/install.md` | CURRENT | migrated to docs/adopters/install.md |
| `docs/adopters/language-policy.md` | CURRENT | migrated to docs/adopters/language-policy.md |
| `docs/adopters/lightweight-ci.md` | CURRENT | migrated to docs/adopters/lightweight-ci.md |
| `docs/adopters/migrating-authority-enforcement.md` | HISTORICAL | not imported; frozen predecessor only |
| `docs/adopters/migrating-to-0.2.0.md` | HISTORICAL | not imported; frozen predecessor only |
| `docs/adopters/migrating-to-0.5.0.md` | HISTORICAL | not imported; frozen predecessor only |
| `docs/adopters/mutation-scenarios.md` | CURRENT | migrated to docs/adopters/mutation-scenarios.md |
| `docs/adopters/pack-resolution.md` | CURRENT | migrated to docs/adopters/pack-resolution.md |
| `docs/adopters/prompt-header.md` | CURRENT | migrated to docs/adopters/prompt-header.md |
| `docs/adopters/role-declaration.md` | DUPLICATE | migrated to docs/adopters/role-declaration.md |
| `docs/adopters/round-break.md` | CURRENT | migrated to docs/adopters/round-break.md |
| `docs/adopters/round-prompts/B0-audit.md` | DUPLICATE | migrated to docs/dev/round-workflow/B0-audit.md |
| `docs/adopters/round-prompts/B1-backlog.md` | DUPLICATE | migrated to docs/dev/round-workflow/B1-backlog.md |
| `docs/adopters/round-prompts/B2-wave-plan.md` | DUPLICATE | migrated to docs/dev/round-workflow/B2-wave-plan.md |
| `docs/adopters/round-prompts/B3-orchestrate.md` | DUPLICATE | migrated to docs/dev/round-workflow/B3-orchestrate.md |
| `docs/adopters/round-prompts/B4-verify-publish.md` | DUPLICATE | migrated to docs/dev/round-workflow/B4-verify-publish.md |
| `docs/adopters/round-prompts/README.md` | DUPLICATE | migrated to docs/dev/round-workflow/README.md |
| `docs/adopters/scorecard-na-overrides.md` | CURRENT | migrated to docs/adopters/scorecard-na-overrides.md |
| `docs/adopters/sense-migrate-check.md` | CURRENT | migrated to docs/adopters/sense-migrate-check.md |
| `docs/adopters/state-layout.md` | CURRENT | migrated to docs/adopters/state-layout.md |
| `docs/adopters/templates/README.md` | CURRENT | migrated to docs/adopters/templates/README.md |
| `docs/adopters/templates/lint-staged-snippet.md` | CURRENT | migrated to docs/adopters/templates/lint-staged-snippet.md |
| `docs/adopters/thresholds.md` | CURRENT | migrated to docs/adopters/thresholds.md |
| `docs/adopters/user-guide.md` | CURRENT | migrated to docs/adopters/user-guide.md |
| `docs/framework/arch/README.md` | CURRENT | migrated to docs/theory/architecture/README.md |
| `docs/framework/arch/cli-grammar.md` | STALE | migrated to docs/reference/cli-grammar.md |
| `docs/framework/arch/id-scheme.md` | CURRENT | migrated to docs/theory/architecture/id-scheme.md |
| `docs/framework/arch/invariant-authoring.md` | CURRENT | migrated to docs/theory/architecture/invariant-authoring.md |
| `docs/framework/arch/invariant-taxonomy.md` | CURRENT | migrated to docs/theory/architecture/invariant-taxonomy.md |
| `docs/framework/arch/known-tech-debt.md` | CURRENT | migrated to docs/dev/known-technical-debt.md |
| `docs/framework/arch/persistence.md` | CURRENT | migrated to docs/theory/architecture/persistence.md |
| `docs/framework/arch/phase-18-plan.md` | HISTORICAL | not imported; frozen predecessor only |
| `docs/framework/arch/phase-19-plan.md` | HISTORICAL | not imported; frozen predecessor only |
| `docs/framework/arch/phase-9-plan.md` | HISTORICAL | not imported; frozen predecessor only |
| `docs/framework/arch/prompt-firewall.md` | CURRENT | migrated to docs/theory/architecture/prompt-firewall.md |
| `docs/framework/arch/prompt-versioning.md` | CURRENT | migrated to docs/theory/architecture/prompt-versioning.md |
| `docs/framework/arch/reference-stack.md` | CURRENT | migrated to docs/theory/architecture/reference-stack.md |
| `docs/framework/arch/rtd.md` | CURRENT | migrated to docs/theory/architecture/rtd.md |
| `docs/framework/arch/runtime-stack.md` | CURRENT | migrated to docs/theory/architecture/runtime-stack.md |
| `docs/framework/arch/sensor-inputs.md` | CURRENT | migrated to docs/theory/architecture/sensor-inputs.md |
| `docs/framework/arch/sensors/README.md` | CURRENT | migrated to docs/theory/architecture/sensors/README.md |
| `docs/framework/arch/sensors/docs_drift.md` | CURRENT | migrated to docs/theory/architecture/sensors/docs_drift.md |
| `docs/framework/arch/sensors/harness_coherence.md` | CURRENT | migrated to docs/theory/architecture/sensors/harness_coherence.md |
| `docs/framework/arch/sensors/harness_coverage.md` | CURRENT | migrated to docs/theory/architecture/sensors/harness_coverage.md |
| `docs/framework/arch/sensors/harness_depth.md` | CURRENT | migrated to docs/theory/architecture/sensors/harness_depth.md |
| `docs/framework/arch/sensors/harness_idiomaticity.md` | CURRENT | migrated to docs/theory/architecture/sensors/harness_idiomaticity.md |
| `docs/framework/arch/sensors/harness_invariant_alignment.md` | CURRENT | migrated to docs/theory/architecture/sensors/harness_invariant_alignment.md |
| `docs/framework/arch/sensors/harness_performance.md` | CURRENT | migrated to docs/theory/architecture/sensors/harness_performance.md |
| `docs/framework/arch/sensors/harness_robustness.md` | CURRENT | migrated to docs/theory/architecture/sensors/harness_robustness.md |
| `docs/framework/arch/sensors/inventory_performance.md` | CURRENT | migrated to docs/theory/architecture/sensors/inventory_performance.md |
| `docs/framework/arch/sensors/plant_coherence.md` | CURRENT | migrated to docs/theory/architecture/sensors/plant_coherence.md |
| `docs/framework/arch/sensors/plant_depth.md` | CURRENT | migrated to docs/theory/architecture/sensors/plant_depth.md |
| `docs/framework/arch/sensors/spec_alignment.md` | CURRENT | migrated to docs/theory/architecture/sensors/spec_alignment.md |
| `docs/framework/arch/sensors/spec_performance_targets.md` | CURRENT | migrated to docs/theory/architecture/sensors/spec_performance_targets.md |
| `docs/framework/arch/sensors/spec_robustness_targets.md` | CURRENT | migrated to docs/theory/architecture/sensors/spec_robustness_targets.md |
| `docs/framework/arch/sensors/spec_security_coverage.md` | CURRENT | migrated to docs/theory/architecture/sensors/spec_security_coverage.md |
| `docs/framework/arch/sensors/test_coherence.md` | CURRENT | migrated to docs/theory/architecture/sensors/test_coherence.md |
| `docs/framework/arch/sensors/test_idiomaticity.md` | CURRENT | migrated to docs/theory/architecture/sensors/test_idiomaticity.md |
| `docs/framework/arch/sensors/test_performance_coverage.md` | CURRENT | migrated to docs/theory/architecture/sensors/test_performance_coverage.md |
| `docs/framework/arch/sensors/test_robustness_coverage.md` | CURRENT | migrated to docs/theory/architecture/sensors/test_robustness_coverage.md |
| `docs/framework/arch/sensors/test_security_coverage.md` | CURRENT | migrated to docs/theory/architecture/sensors/test_security_coverage.md |
| `docs/framework/arch/sensors/threshold-resolution.md` | CURRENT | migrated to docs/theory/architecture/sensors/threshold-resolution.md |
| `docs/framework/arch/skill-roadmap.md` | CURRENT | migrated to docs/dev/skill-roadmap.md |
| `docs/framework/arch/test-weakening.md` | CURRENT | migrated to docs/theory/architecture/test-weakening.md |
| `docs/framework/arch/tool-surface.md` | CURRENT | migrated to docs/theory/architecture/tool-surface.md |
| `docs/framework/aspect-grid.md` | CURRENT | migrated to docs/theory/framework/aspect-grid.md |
| `docs/framework/concurrency.md` | CURRENT | migrated to docs/theory/framework/concurrency.md |
| `docs/framework/constitution.md` | CURRENT | pointer at docs/reference/law.md |
| `docs/framework/contracts/README.md` | CURRENT | migrated to docs/reference/contracts/README.md |
| `docs/framework/contracts/state-extensions.md` | CURRENT | migrated to docs/reference/contracts/state-extensions.md |
| `docs/framework/contracts/test-result.md` | CURRENT | migrated to docs/reference/contracts/test-result.md |
| `docs/framework/evidence.md` | CURRENT | migrated to docs/theory/framework/evidence.md |
| `docs/framework/glossary/README.md` | CURRENT | pointer at docs/reference/glossary.md |
| `docs/framework/index.md` | STALE | migrated to docs/theory/framework.md |
| `docs/framework/invariants.md` | CURRENT | migrated to docs/theory/framework/invariants.md |
| `docs/framework/loop.md` | CURRENT | migrated to docs/theory/framework/loop.md |
| `docs/framework/product/README.md` | CURRENT | merged pointer at docs/reference/product.md |
| `docs/framework/product/owner-mandates/OM-001.md` | CURRENT | merged pointer at docs/reference/product.md |
| `docs/framework/scorecard.md` | CURRENT | migrated to docs/theory/framework/scorecard.md |
| `docs/framework/substrates.md` | CURRENT | migrated to docs/theory/framework/substrates.md |
| `docs/framework/test-policy.md` | CURRENT | migrated to docs/theory/framework/test-policy.md |
| `docs/framework/transversals.md` | CURRENT | migrated to docs/theory/framework/transversals.md |
| `docs/index.md` | CURRENT | replaced by fresh successor docs/index.md |
| `docs/meta/build-plan-index.md` | CURRENT | stale-at-import pointer at docs/dev/round-ledger.md |
| `docs/meta/build-plan.md` | MACHINERY | not imported; regenerated projection |
| `docs/meta/changelog-index.md` | STALE | replaced by generated-index stub docs/reference/changelog-index.md |
| `docs/meta/changelog.md` | MACHINERY | not imported; regenerated projection |
| `docs/meta/contributing.md` | CURRENT | migrated to docs/dev/contributing.md |
| `docs/meta/decisions-index.md` | STALE | replaced by generated-index stub docs/reference/decisions-index.md |
| `docs/meta/decisions.md` | MACHINERY | not imported; regenerated projection |
| `docs/meta/dev-process.md` | CURRENT | migrated to docs/dev/process.md |
| `docs/meta/governance-roadmap.md` | CURRENT | migrated to docs/reference/predecessor-governance-roadmap.md |
| `docs/meta/index.md` | CURRENT | migrated to docs/dev/self-application.md |
| `docs/meta/ops/README.md` | CURRENT | migrated to docs/dev/operations/README.md |
| `docs/meta/ops/capacity.md` | CURRENT | migrated to docs/dev/operations/capacity.md |
| `docs/meta/ops/current-scorecard.md` | HISTORICAL | not imported; frozen predecessor only |
| `docs/meta/ops/current-test-matrix.md` | HISTORICAL | not imported; frozen predecessor only |
| `docs/meta/ops/db-isolation.md` | CURRENT | migrated to docs/dev/operations/db-isolation.md |
| `docs/meta/ops/evidence-chain-runbook.md` | CURRENT | migrated to docs/dev/operations/evidence-chain-runbook.md |
| `docs/meta/ops/incident-playbook.md` | CURRENT | migrated to docs/dev/operations/incident-playbook.md |
| `docs/meta/ops/local-evidence-runbook.md` | CURRENT | migrated to docs/dev/operations/local-evidence-runbook.md |
| `docs/meta/ops/lock-runbook.md` | CURRENT | migrated to docs/dev/operations/lock-runbook.md |
| `docs/meta/ops/loop-runbook.md` | CURRENT | migrated to docs/dev/operations/loop-runbook.md |
| `docs/meta/ops/phase-36-main-ci-audit.md` | HISTORICAL | not imported; frozen predecessor only |
| `docs/meta/ops/phase-37-coverage-audit.md` | HISTORICAL | not imported; frozen predecessor only |
| `docs/meta/ops/release-discipline.md` | CURRENT | migrated to docs/dev/operations/release-discipline.md |
| `docs/meta/ops/slos.md` | CURRENT | migrated to docs/dev/operations/slos.md |
| `docs/meta/ops/structural-sensor-exemptions.md` | CURRENT | migrated to docs/dev/operations/structural-sensor-exemptions.md |
| `docs/meta/ops/testing.md` | CURRENT | migrated to docs/dev/operations/testing.md |
| `docs/meta/ops/versioning-policy.md` | CURRENT | migrated to docs/dev/operations/versioning-policy.md |
| `docs/meta/ops/worktree-runbook.md` | CURRENT | migrated to docs/dev/operations/worktree-runbook.md |
| `docs/meta/security/README.md` | CURRENT | migrated to docs/dev/security/README.md |
| `docs/meta/security/audit-requirements.md` | CURRENT | migrated to docs/dev/security/audit-requirements.md |
| `docs/meta/security/authority-enforcement.md` | CURRENT | migrated to docs/dev/security/authority-enforcement.md |
| `docs/meta/security/forbidden-actions.md` | CURRENT | migrated to docs/dev/security/forbidden-actions.md |
| `docs/meta/security/inv-override-discipline.md` | CURRENT | migrated to docs/dev/security/inv-override-discipline.md |
| `docs/meta/security/prompt-firewall-notes.md` | CURRENT | migrated to docs/dev/security/prompt-firewall-notes.md |
| `docs/meta/security/secret-handling.md` | CURRENT | migrated to docs/dev/security/secret-handling.md |
| `docs/meta/security/threat-model.md` | CURRENT | migrated to docs/dev/security/threat-model.md |
| `docs/meta/self-scorecard.md` | MACHINERY | not imported; regenerated projection |
| `docs/meta/test-matrix.md` | MACHINERY | not imported; regenerated projection |
| `docs/reference/examples.md` | CURRENT | migrated to docs/reference/examples.md |
| `docs/reference/index.md` | CURRENT | migrated to docs/reference/index.md |
| `docs/reference/scripts.md` | CURRENT | migrated to docs/reference/scripts.md |
| `docs/reference/sensors-quick-ref.md` | CURRENT | migrated to docs/reference/sensors-quick-ref.md |
| `docs/reference/skills/README.md` | CURRENT | migrated to docs/reference/skills/README.md |
| `docs/reference/skills/fix-build.md` | CURRENT | migrated to docs/reference/skills/fix-build.md |
| `docs/reference/skills/fix-lint.md` | CURRENT | migrated to docs/reference/skills/fix-lint.md |
| `docs/reference/skills/fix-test.md` | CURRENT | migrated to docs/reference/skills/fix-test.md |
| `docs/reference/skills/round-audit.md` | DUPLICATE | migrated to docs/reference/skills/round-audit.md |
| `docs/reference/skills/round-backlog.md` | DUPLICATE | migrated to docs/reference/skills/round-backlog.md |
| `docs/reference/skills/round-execute.md` | DUPLICATE | migrated to docs/reference/skills/round-execute.md |
| `docs/reference/skills/round-orchestrate.md` | DUPLICATE | migrated to docs/reference/skills/round-orchestrate.md |
| `docs/reference/skills/round-verify-publish.md` | DUPLICATE | migrated to docs/reference/skills/round-verify-publish.md |
| `docs/roles/README.md` | CURRENT | migrated to docs/roles/README.md |
| `docs/roles/agent-disciplines.md` | CURRENT | migrated to docs/roles/agent-disciplines.md |
| `docs/roles/architect.md` | CURRENT | migrated to docs/roles/architect.md |
| `docs/roles/auditor.md` | CURRENT | migrated to docs/roles/auditor.md |
| `docs/roles/cross-role-coordination.md` | CURRENT | migrated to docs/roles/cross-role-coordination.md |
| `docs/roles/engineer.md` | CURRENT | migrated to docs/roles/engineer.md |
| `docs/roles/index.md` | CURRENT | migrated to docs/roles/index.md |
| `docs/roles/inspector.md` | CURRENT | migrated to docs/roles/inspector.md |
| `docs/roles/owner.md` | CURRENT | migrated to docs/roles/owner.md |
| `docs/start/index.md` | CURRENT | migrated to docs/start/index.md |
| `docs/start/reading-order.md` | CURRENT | migrated to docs/start/reading-order.md |
| `docs/start/status.md` | CURRENT | replaced by fresh successor docs/start/status.md |
| `docs/start/what-is-devai.md` | CURRENT | migrated to docs/start/what-is-devai.md |
| `docs/theory/devai-theory.md` | CURRENT | migrated to docs/theory/devai-theory.md |
| `docs/theory/diagrams/prompts/README.md` | CURRENT | migrated to docs/theory/diagrams/prompts/README.md |
| `docs/theory/diagrams/prompts/fig-01-system-overview.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-01-system-overview.md |
| `docs/theory/diagrams/prompts/fig-02-three-loops.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-02-three-loops.md |
| `docs/theory/diagrams/prompts/fig-03-state-decomposition.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-03-state-decomposition.md |
| `docs/theory/diagrams/prompts/fig-04-rgr-loop.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-04-rgr-loop.md |
| `docs/theory/diagrams/prompts/fig-05-feedforward-composer.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-05-feedforward-composer.md |
| `docs/theory/diagrams/prompts/fig-06-observer-pipeline.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-06-observer-pipeline.md |
| `docs/theory/diagrams/prompts/fig-07-scorecard-chips.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-07-scorecard-chips.md |
| `docs/theory/diagrams/prompts/fig-08-adherence.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-08-adherence.md |
| `docs/theory/diagrams/prompts/fig-09-triage-fdi.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-09-triage-fdi.md |
| `docs/theory/diagrams/prompts/fig-10-inner-loop-sequence.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-10-inner-loop-sequence.md |
| `docs/theory/diagrams/prompts/fig-11-input-saturation.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-11-input-saturation.md |
| `docs/theory/diagrams/prompts/fig-12-feedforward-layers.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-12-feedforward-layers.md |
| `docs/theory/diagrams/prompts/fig-13-forbidden-paths.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-13-forbidden-paths.md |
| `docs/theory/diagrams/prompts/fig-14-prompt-firewall.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-14-prompt-firewall.md |
| `docs/theory/diagrams/prompts/fig-15-controllable-subspace.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-15-controllable-subspace.md |
| `docs/theory/diagrams/prompts/fig-16-article23-ladder.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-16-article23-ladder.md |
| `docs/theory/diagrams/prompts/fig-17-rgr-loop-redux.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-17-rgr-loop-redux.md |
| `docs/theory/diagrams/prompts/fig-18-termination.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-18-termination.md |
| `docs/theory/diagrams/prompts/fig-19-task-lifecycle.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-19-task-lifecycle.md |
| `docs/theory/diagrams/prompts/fig-20-reference-disturbance.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-20-reference-disturbance.md |
| `docs/theory/diagrams/prompts/fig-21-rosetta.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-21-rosetta.md |
| `docs/theory/diagrams/prompts/fig-22-effect-gate.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-22-effect-gate.md |
| `docs/theory/diagrams/prompts/fig-23-path-domains.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-23-path-domains.md |
| `docs/theory/diagrams/prompts/fig-24-severity-pyramid.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-24-severity-pyramid.md |
| `docs/theory/diagrams/prompts/fig-25-evidence-chain.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-25-evidence-chain.md |
| `docs/theory/diagrams/prompts/fig-26-sensor-taxonomy.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-26-sensor-taxonomy.md |
| `docs/theory/diagrams/prompts/fig-27-adoption-paths.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-27-adoption-paths.md |
| `docs/theory/diagrams/prompts/fig-28-amendment-timeline.md` | CURRENT | migrated to docs/theory/diagrams/prompts/fig-28-amendment-timeline.md |
| `docs/theory/index.md` | CURRENT | migrated to docs/theory/index.md |
| `docs/adopters/governed-rounds.md` | CURRENT (post-audit) | migrated to docs/adopters/governed-rounds.md |
| `docs/reference/sensor-registry.md` | CURRENT (post-audit) | migrated to docs/reference/sensor-registry.md |
| `docs/framework/phase-ledger.md` | MACHINERY (post-audit) | not imported; generated ledger/index projection |
| `docs/meta/rounds.md` | MACHINERY (post-audit) | not imported; generated ledger/index projection |
| `SECURITY.md` | STALE | migrated to docs/dev/security-policy.md; command corrected |
| `docs/site/docusaurus.config.ts` | MACHINERY | imported/re-targeted for successor IA |
| `docs/site/sidebars.ts` | MACHINERY | imported/re-targeted for successor IA |
| `docs/site/scripts/sync-docs.mjs` | MACHINERY | imported/re-targeted for successor IA |
| `docs/site/package.json` | MACHINERY | imported/re-targeted for successor IA |
| `docs/site/package-lock.json` | MACHINERY | imported/re-targeted for successor IA |
| `docs/site/tsconfig.json` | MACHINERY | imported/re-targeted for successor IA |
| `docs/site/.gitignore` | MACHINERY | imported/re-targeted for successor IA |
| `docs/site/src/css/custom.css` | MACHINERY | imported/re-targeted for successor IA |

## Fresh successor pages

- `docs/index.md`
- `docs/start/status.md`
- `docs/dev/index.md`
- `docs/reference/history.md`
- generated-index stubs and canon pointers named above

## Deferred

- Generated CLI reference: regenerate from the successor registry after the
  P4/P7 command surface is authoritative; suggested wave R-0002/W01.
- Versioned site snapshots: begin at 1.0.0 only after founding ratification;
  suggested wave R-0002/W02.
- Generated decision, changelog, round-ledger, scorecard, and test-matrix
  projections: populate from successor sources after the corresponding
  generators exist; suggested wave R-0002/W01.
