// @generated from law/policy/action-registry.json
// Do not edit; run node scripts/generate-action-registry.mjs.

export const ACTION_EFFECT_CONTRACTS = [
  {
    "action_id": "ci scaffold",
    "public_action_id": "adopt ci scaffold",
    "effect": "local-write",
    "capabilities": [
      "fs:workspace"
    ]
  },
  {
    "action_id": "hooks install",
    "public_action_id": "adopt hooks install",
    "effect": "local-write",
    "capabilities": [
      "fs:f5-config",
      "fs:workspace"
    ]
  },
  {
    "action_id": "pack graduate-invariants",
    "public_action_id": "adopt pack graduate",
    "effect": "local-write",
    "capabilities": [
      "fs:workspace"
    ]
  },
  {
    "action_id": "pack resolve",
    "public_action_id": "adopt pack resolve",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "upgrade",
    "public_action_id": "adopt upgrade",
    "effect": "local-write",
    "capabilities": [
      "fs:f5-config"
    ]
  },
  {
    "action_id": "llm probe",
    "public_action_id": "agent llm probe",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "prompts compose",
    "public_action_id": "agent prompt compose",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "prompts diff",
    "public_action_id": "agent prompt diff",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "prompts freeze",
    "public_action_id": "agent prompt freeze",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "skill list",
    "public_action_id": "agent skill list",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "skill run",
    "public_action_id": "agent skill run",
    "effect": "local-write",
    "capabilities": [
      "fs:workspace",
      "proc:git",
      "proc:npx",
      "proc:pnpm",
      "proc:node"
    ]
  },
  {
    "action_id": "actions list",
    "public_action_id": "catalog actions",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "docs cli",
    "public_action_id": "docs cli",
    "effect": "local-write",
    "capabilities": [
      "fs:workspace"
    ]
  },
  {
    "action_id": "docs decisions render",
    "public_action_id": "docs decisions render",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "docs links",
    "public_action_id": "docs links",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "docs publish",
    "public_action_id": "docs publish",
    "effect": "remote-write",
    "capabilities": [
      "net:github-pages",
      "fs:workspace",
      "fs:worktree-admin",
      "fs:f5-state",
      "proc:git",
      "proc:dynamic"
    ]
  },
  {
    "action_id": "docs render-mermaid",
    "public_action_id": "docs render mermaid",
    "effect": "local-write",
    "capabilities": [
      "fs:workspace",
      "proc:dynamic",
      "proc:mmdc",
      "proc:which"
    ]
  },
  {
    "action_id": "docs rounds render",
    "public_action_id": "docs rounds render",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "docs synthesize",
    "public_action_id": "docs synthesize",
    "effect": "local-write",
    "capabilities": [
      "fs:workspace"
    ]
  },
  {
    "action_id": "docs synthesize-all",
    "public_action_id": "docs synthesize all",
    "effect": "local-write",
    "capabilities": [
      "fs:workspace"
    ]
  },
  {
    "action_id": "doctor",
    "public_action_id": "doctor",
    "effect": "read",
    "capabilities": [
      "proc:sh",
      "proc:dynamic",
      "proc:git",
      "proc:npx",
      "proc:gh"
    ]
  },
  {
    "action_id": "evidence actions-verify",
    "public_action_id": "evidence actions verify",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs",
      "proc:git"
    ]
  },
  {
    "action_id": "evidence chain-head",
    "public_action_id": "evidence chain head",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "evidence verify",
    "public_action_id": "evidence chain verify",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "coverage aggregate",
    "public_action_id": "evidence coverage aggregate",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "evidence emit",
    "public_action_id": "evidence emit",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "evidence collect-local",
    "public_action_id": "evidence local collect",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "evidence verify-local",
    "public_action_id": "evidence local verify",
    "effect": "read",
    "capabilities": [
      "proc:git"
    ]
  },
  {
    "action_id": "evidence redact",
    "public_action_id": "evidence redact",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "render matrix",
    "public_action_id": "evidence test matrix",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "record run",
    "public_action_id": "evidence test record",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs",
      "proc:git",
      "proc:sh"
    ]
  },
  {
    "action_id": "loop run",
    "public_action_id": "experimental loop run",
    "effect": "local-write",
    "capabilities": [
      "fs:workspace",
      "fs:f5-state",
      "fs:worktree-admin",
      "db:write"
    ]
  },
  {
    "action_id": "govern auditor-post-merge",
    "public_action_id": "govern auditor post-merge",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "phase close",
    "public_action_id": "govern phase close",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "phase ledger",
    "public_action_id": "govern phase ledger",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "rgr emit",
    "public_action_id": "govern rgr emit",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "rgr list",
    "public_action_id": "govern rgr list",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "rgr resolve",
    "public_action_id": "govern rgr resolve",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "rgr show",
    "public_action_id": "govern rgr show",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "score assess",
    "public_action_id": "govern score assess",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "score backlog-refresh",
    "public_action_id": "govern score backlog refresh",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "score compute",
    "public_action_id": "govern score compute",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "score view",
    "public_action_id": "govern score view",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "triage classify",
    "public_action_id": "govern triage classify",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "triage dispatch",
    "public_action_id": "govern triage dispatch",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "triage tie-break",
    "public_action_id": "govern triage tie break",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "init apply-architect",
    "public_action_id": "init apply-architect",
    "effect": "local-write",
    "capabilities": [
      "fs:workspace"
    ]
  },
  {
    "action_id": "init apply-f5",
    "public_action_id": "init apply-f5",
    "effect": "local-write",
    "capabilities": [
      "fs:f5-config"
    ]
  },
  {
    "action_id": "init apply-owner",
    "public_action_id": "init apply-owner",
    "effect": "local-write",
    "capabilities": [
      "fs:workspace"
    ]
  },
  {
    "action_id": "init plan",
    "public_action_id": "init plan",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "inv adherence-reverse",
    "public_action_id": "inventory adherence",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "inv components",
    "public_action_id": "inventory components",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "inv contracts",
    "public_action_id": "inventory contracts",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "inv coverage",
    "public_action_id": "inventory coverage",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "inv dependencies",
    "public_action_id": "inventory dependencies",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "inv glossary",
    "public_action_id": "inventory glossary",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "inv modules",
    "public_action_id": "inventory modules",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "inv regen",
    "public_action_id": "inventory regen",
    "effect": "read",
    "capabilities": [
      "proc:git"
    ]
  },
  {
    "action_id": "inv routes",
    "public_action_id": "inventory routes",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "inv schemas",
    "public_action_id": "inventory schemas",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "inv suggest",
    "public_action_id": "inventory suggest",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "inv tests",
    "public_action_id": "inventory tests",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "check action-effects",
    "public_action_id": "policy check action effects",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "check adrs",
    "public_action_id": "policy check adrs",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "check ci-economy",
    "public_action_id": "policy check ci economy",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "check dependencies",
    "public_action_id": "policy check dependencies",
    "effect": "read",
    "capabilities": [
      "proc:pnpm"
    ]
  },
  {
    "action_id": "check docs-governance",
    "public_action_id": "policy check docs governance",
    "effect": "read",
    "capabilities": [
      "proc:git",
      "proc:dynamic"
    ]
  },
  {
    "action_id": "check forbidden-actions",
    "public_action_id": "policy check forbidden actions",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "check glob-guards",
    "public_action_id": "policy check glob guards",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "check overrides",
    "public_action_id": "policy check overrides",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "check pr-compliance",
    "public_action_id": "policy check pr compliance",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "check prompt-overlays",
    "public_action_id": "policy check prompt overlays",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "check sensor-integrity",
    "public_action_id": "policy check sensor integrity",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "release gate",
    "public_action_id": "release gate",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "release list",
    "public_action_id": "release list",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "release postdeploy-verify",
    "public_action_id": "release postdeploy verify",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "release runtime-drift",
    "public_action_id": "release runtime drift",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "round archive",
    "public_action_id": "round archive",
    "effect": "local-write",
    "capabilities": [
      "fs:workspace",
      "proc:git"
    ]
  },
  {
    "action_id": "round declare",
    "public_action_id": "round declare",
    "effect": "local-write",
    "capabilities": [
      "fs:workspace"
    ]
  },
  {
    "action_id": "round scaffold",
    "public_action_id": "round scaffold",
    "effect": "local-write",
    "capabilities": [
      "fs:workspace"
    ]
  },
  {
    "action_id": "round status",
    "public_action_id": "round status",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense archive-immutability",
    "public_action_id": "sense archive immutability",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense build",
    "public_action_id": "sense build",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense decision-citation-resolution",
    "public_action_id": "sense decision citation resolution",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense decision-record-integrity",
    "public_action_id": "sense decision record integrity",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense docs-drift",
    "public_action_id": "sense docs drift",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense harness-coherence",
    "public_action_id": "sense harness coherence",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense harness-coverage",
    "public_action_id": "sense harness coverage",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense harness-depth",
    "public_action_id": "sense harness depth",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense harness-green-main",
    "public_action_id": "sense harness green main",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense harness-idiomaticity",
    "public_action_id": "sense harness idiomaticity",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense harness-invariant-alignment",
    "public_action_id": "sense harness invariant alignment",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense harness-performance",
    "public_action_id": "sense harness performance",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense harness-robustness",
    "public_action_id": "sense harness robustness",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense harness-security",
    "public_action_id": "sense harness security",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense inventory-adherence",
    "public_action_id": "sense inventory adherence",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense api",
    "public_action_id": "sense inventory api",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense coverage",
    "public_action_id": "sense inventory coverage",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense data-handling",
    "public_action_id": "sense inventory data handling",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense data-model",
    "public_action_id": "sense inventory data model",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense dep-graph",
    "public_action_id": "sense inventory dep graph",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense inventory-determinism",
    "public_action_id": "sense inventory determinism",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense inventory-performance",
    "public_action_id": "sense inventory performance",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense rbac",
    "public_action_id": "sense inventory rbac",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense routes",
    "public_action_id": "sense inventory routes",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense judge",
    "public_action_id": "sense judge",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense lint",
    "public_action_id": "sense lint",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense migrate-check",
    "public_action_id": "sense migrate check",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "mutation run",
    "public_action_id": "sense mutation run",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "mutation verify",
    "public_action_id": "sense mutation verify",
    "effect": "local-write",
    "capabilities": [
      "fs:workspace"
    ]
  },
  {
    "action_id": "sense perf-test",
    "public_action_id": "sense perf test",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense plant-coherence",
    "public_action_id": "sense plant coherence",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense plant-coverage",
    "public_action_id": "sense plant coverage",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense plant-depth",
    "public_action_id": "sense plant depth",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense readings-rebuild",
    "public_action_id": "sense readings rebuild",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "sense readings-record",
    "public_action_id": "sense readings record",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "sense round-record-integrity",
    "public_action_id": "sense round record integrity",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense run",
    "public_action_id": "sense run",
    "effect": "read",
    "capabilities": [
      "proc:dynamic"
    ]
  },
  {
    "action_id": "sense runtime-api",
    "public_action_id": "sense runtime api",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense runtime-auth",
    "public_action_id": "sense runtime auth",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense runtime-data",
    "public_action_id": "sense runtime data",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense security-scan",
    "public_action_id": "sense security scan",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense site-drift",
    "public_action_id": "sense site drift",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense spec-alignment",
    "public_action_id": "sense spec alignment",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense spec-depth",
    "public_action_id": "sense spec depth",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense spec-freshness",
    "public_action_id": "sense spec freshness",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense spec-idiomaticity",
    "public_action_id": "sense spec idiomaticity",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense spec-performance-targets",
    "public_action_id": "sense spec performance targets",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense spec-robustness-targets",
    "public_action_id": "sense spec robustness targets",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense spec-security-coverage",
    "public_action_id": "sense spec security coverage",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense test",
    "public_action_id": "sense test",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense test-coherence",
    "public_action_id": "sense test coherence",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense test-coverage-depth",
    "public_action_id": "sense test coverage depth",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense test-idiomaticity",
    "public_action_id": "sense test idiomaticity",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense test-invariant-alignment",
    "public_action_id": "sense test invariant alignment",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense test-performance-coverage",
    "public_action_id": "sense test performance coverage",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense test-robustness-coverage",
    "public_action_id": "sense test robustness coverage",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense test-security-coverage",
    "public_action_id": "sense test security coverage",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense test-weakening",
    "public_action_id": "sense test weakening",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense trace-resolve",
    "public_action_id": "sense trace resolve",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "sense type-check",
    "public_action_id": "sense type check",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "blueprint diff",
    "public_action_id": "spec blueprint diff",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "blueprint plan",
    "public_action_id": "spec blueprint plan",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "blueprint validate",
    "public_action_id": "spec blueprint validate",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "decision close",
    "public_action_id": "spec decision close",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "rtd bundle",
    "public_action_id": "spec rtd bundle",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "spec validate-action-coverage",
    "public_action_id": "spec validate action coverage",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "spec validate-all",
    "public_action_id": "spec validate all",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "spec validate-glossary",
    "public_action_id": "spec validate glossary",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "spec validate-invariant-strategies",
    "public_action_id": "spec validate invariant strategies",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "spec validate-invariants",
    "public_action_id": "spec validate invariants",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "spec validate-journeys",
    "public_action_id": "spec validate journeys",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "spec validate-schema",
    "public_action_id": "spec validate schema",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "spec validate-test-trace",
    "public_action_id": "spec validate test trace",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "spec validate-trace",
    "public_action_id": "spec validate trace",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "verify translation",
    "public_action_id": "verify translation",
    "effect": "local-write",
    "capabilities": [
      "fs:f5-state",
      "fs:worktree-admin",
      "db:read",
      "db:write",
      "proc:docker",
      "proc:git",
      "proc:psql",
      "proc:sandbox-exec"
    ]
  },
  {
    "action_id": "backlog add",
    "public_action_id": "work backlog add",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "backlog compact",
    "public_action_id": "work backlog compact",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "backlog complete",
    "public_action_id": "work backlog complete",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "backlog list",
    "public_action_id": "work backlog list",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "backlog next",
    "public_action_id": "work backlog next",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "db drop",
    "public_action_id": "work db drop",
    "effect": "local-write",
    "capabilities": [
      "db:write"
    ]
  },
  {
    "action_id": "db provision",
    "public_action_id": "work db provision",
    "effect": "local-write",
    "capabilities": [
      "db:write"
    ]
  },
  {
    "action_id": "db rebuild-template",
    "public_action_id": "work db rebuild template",
    "effect": "local-write",
    "capabilities": [
      "db:write"
    ]
  },
  {
    "action_id": "db start-shared",
    "public_action_id": "work db start shared",
    "effect": "local-write",
    "capabilities": [
      "db:write"
    ]
  },
  {
    "action_id": "db status",
    "public_action_id": "work db status",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "db stop-shared",
    "public_action_id": "work db stop shared",
    "effect": "local-write",
    "capabilities": [
      "db:write"
    ]
  },
  {
    "action_id": "lock acquire",
    "public_action_id": "work lock acquire",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "lock list",
    "public_action_id": "work lock list",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "lock reap",
    "public_action_id": "work lock reap",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "lock release",
    "public_action_id": "work lock release",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "work session end",
    "public_action_id": "work session end",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "work session start",
    "public_action_id": "work session start",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "state prune",
    "public_action_id": "work state prune",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:workspace"
    ]
  },
  {
    "action_id": "task complete",
    "public_action_id": "work task complete",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:worktree-admin",
      "fs:proofs"
    ]
  },
  {
    "action_id": "task escalate",
    "public_action_id": "work task escalate",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "task list",
    "public_action_id": "work task list",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "task pause-rgr",
    "public_action_id": "work task pause rgr",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "task resume-rgr",
    "public_action_id": "work task resume rgr",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "task spawn",
    "public_action_id": "work task spawn",
    "effect": "harness-write",
    "capabilities": [
      "fs:f5-state",
      "fs:worktree-admin",
      "fs:proofs"
    ]
  },
  {
    "action_id": "worktree adopt",
    "public_action_id": "work worktree adopt",
    "effect": "harness-write",
    "capabilities": [
      "fs:worktree-admin",
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "worktree create",
    "public_action_id": "work worktree create",
    "effect": "harness-write",
    "capabilities": [
      "fs:worktree-admin",
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "worktree destroy",
    "public_action_id": "work worktree destroy",
    "effect": "harness-write",
    "capabilities": [
      "fs:worktree-admin",
      "fs:f5-state",
      "fs:proofs"
    ]
  },
  {
    "action_id": "worktree list",
    "public_action_id": "work worktree list",
    "effect": "read",
    "capabilities": []
  },
  {
    "action_id": "worktree reap",
    "public_action_id": "work worktree reap",
    "effect": "harness-write",
    "capabilities": [
      "fs:worktree-admin",
      "fs:f5-state",
      "fs:proofs"
    ]
  }
] as const;
