import { defaultExclude, defaultInclude, type TestProjectConfiguration } from 'vitest/config';

export const SERIALIZED_DETACHED_CONTRACTS = [
  'tests/contract/pre-r0007-close-controls.red.contract.test.ts',
  'tests/contract/pre-r0007-cycle1-defect-classes.red.contract.test.ts',
  'tests/contract/pre-r0007-impact-dag.adversarial.contract.test.ts',
  'tests/contract/pre-r0007-manifest-gate.red.contract.test.ts',
  'tests/contract/pre-r0007-remediation-1.red.contract.test.ts',
  'tests/contract/pre-r0007-remediation-2.red.contract.test.ts',
  'tests/contract/pre-r0007-remediation-3.red.contract.test.ts',
  'tests/contract/pre-r0007-remediation-4.red.contract.test.ts',
  'tests/contract/pre-r0007-remediation-5.red.contract.test.ts',
  'tests/contract/pre-r0007-review-run-1-repairs.red.contract.test.ts',
  'tests/contract/pre-r0007-round-artifact-uniqueness.red.contract.test.ts',
  'tests/contract/r0006-output-totality-cycle5.red.contract.test.ts',
] as const;

interface EvidencePreservingProjectOptions {
  readonly ordinaryName: string;
  readonly serializedName: string;
  readonly include?: readonly string[];
}

export function evidencePreservingProjects({
  ordinaryName,
  serializedName,
  include = defaultInclude,
}: EvidencePreservingProjectOptions): TestProjectConfiguration[] {
  return [
    {
      test: {
        name: ordinaryName,
        include: [...include],
        exclude: [...defaultExclude, ...SERIALIZED_DETACHED_CONTRACTS],
        sequence: { groupOrder: 0 },
      },
    },
    {
      test: {
        name: serializedName,
        include: [...SERIALIZED_DETACHED_CONTRACTS],
        exclude: [...defaultExclude],
        fileParallelism: false,
        sequence: { groupOrder: 1 },
      },
    },
  ];
}
