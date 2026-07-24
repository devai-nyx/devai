import { existsSync, mkdirSync, writeFileSync } from '@devai-nyx/authority';
import { dirname, join } from 'node:path';

/**
 * D-123 (item 5): a starter CI workflow that calls the canonical
 * `reusable-evidence-gate.yml` (D-121) instead of every adopter
 * hand-rolling (or copy-pasting and drifting from) their own inline
 * pipeline the way stynx's original devai-gates.yml did. Adopters can
 * still edit triggers/inputs freely; the gate job body itself is
 * never duplicated locally, so it can't drift from devai's own gate
 * logic.
 */

export type CiScaffoldMode = 'gate' | 'verify';

export interface CiScaffoldOptions {
  readonly targetRoot: string;
  readonly outputPath?: string;
  readonly devaiRef?: string;
  readonly mode?: CiScaffoldMode;
  readonly chainFile?: string;
}

export interface CiScaffoldPlan {
  readonly path: string;
  readonly content: string;
  readonly exists: boolean;
}

const DEFAULT_OUTPUT_RELATIVE = '.github/workflows/devai-gates.yml';

export function buildCiScaffoldPlan(opts: CiScaffoldOptions): CiScaffoldPlan {
  const path = opts.outputPath ?? join(opts.targetRoot, DEFAULT_OUTPUT_RELATIVE);
  const devaiRef = opts.devaiRef ?? 'main';
  const mode = opts.mode ?? 'gate';
  const chainFile = opts.chainFile ?? 'record/proofs/chain.json';
  const content = `# Scaffolded by \`devai adopt ci scaffold\` (D-123, item 5). Calls the
# canonical reusable-evidence-gate.yml so this repo's evidence gate
# can't drift from devai's own gate logic (D-121). Edit the \`on:\`
# triggers below to fit this repo; extend reusable-evidence-gate.yml
# upstream in devai-nyx/devai instead of duplicating gate internals
# here.
name: devai-gates

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  workflow_dispatch: {}

concurrency:
  group: devai-gates-\${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  evidence-gate:
    uses: devai-nyx/devai/.github/workflows/reusable-evidence-gate.yml@${devaiRef}
    with:
      mode: ${mode}
      chain-file: ${chainFile}
`;
  return { path, content, exists: existsSync(path) };
}

export interface CiScaffoldResult {
  readonly written: boolean;
  readonly reason?: string;
}

export function executeCiScaffoldPlan(
  plan: CiScaffoldPlan,
  opts: { force?: boolean } = {},
): CiScaffoldResult {
  if (plan.exists && opts.force !== true) {
    return { written: false, reason: 'exists (use --force to overwrite)' };
  }
  mkdirSync(dirname(plan.path), { recursive: true });
  writeFileSync(plan.path, plan.content);
  return { written: true };
}
