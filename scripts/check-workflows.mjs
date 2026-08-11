#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';

export const LEDGER_WORKFLOW_FILE = 'devai-ledger-verify.yml';
export const VERIFIER_REPOSITORY = 'devai-nyx/devai-verifier';
export const VERIFIER_COMMIT = '2c6e5acaade7aae65d23f86fc7f6fdf7e56d945c';
export const CANDIDATE_SHA_EXPRESSION = '${{ github.event.pull_request.head.sha || github.sha }}';

const OLD_WORKFLOW_MARKERS = [
  'cold-sentinel',
  'round-gates',
  'reusable-evidence-gate',
  'devai-gates',
];
const PRODUCT_EXECUTION = [
  /\bpnpm\b/u,
  /\bnpm\s+(?:run|test|exec)\b/u,
  /\byarn\b/u,
  /\bbun\s+(?:run|test)\b/u,
  /\bvitest\b/u,
  /\bjest\b/u,
  /\bpytest\b/u,
  /\bcoverage\b/iu,
  /\btsc\b/u,
  /\beslint\b/u,
  /\bprettier\b/u,
  /\b(?:make|gradle|mvn)\s+(?:build|test|check)\b/iu,
];

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function workflowFiles(root) {
  const directory = join(root, '.github/workflows');
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => /\.ya?ml$/u.test(name))
    .sort();
}

function finding(code, file, detail) {
  return { code, file, detail };
}

export function checkWorkflowTree(root = process.cwd()) {
  const findings = [];
  const files = workflowFiles(root);
  if (files.length !== 1 || files[0] !== LEDGER_WORKFLOW_FILE) {
    findings.push(
      finding(
        'CI_WORKFLOW_SET_INVALID',
        '.github/workflows',
        `expected exactly ${LEDGER_WORKFLOW_FILE}; found ${files.join(', ') || 'none'}`,
      ),
    );
  }
  for (const file of files) {
    const path = join(root, '.github/workflows', file);
    const source = readFileSync(path, 'utf8');
    checkWorkflow(file, source, findings);
  }
  return { ok: findings.length === 0, files, findings };
}

function checkWorkflow(file, source, findings) {
  for (const marker of OLD_WORKFLOW_MARKERS) {
    if (file.includes(marker) || source.includes(marker)) {
      findings.push(finding('CI_OBSOLETE_WORKFLOW_PRESENT', file, marker));
    }
  }

  const document = parseDocument(source, { uniqueKeys: true });
  if (document.errors.length > 0) {
    for (const error of document.errors) {
      findings.push(finding('CI_WORKFLOW_YAML_INVALID', file, error.message));
    }
    return;
  }
  const workflow = object(document.toJS());

  const permissions = object(workflow.permissions);
  if (Object.keys(permissions).length !== 1 || permissions.contents !== 'read') {
    findings.push(
      finding('CI_WORKFLOW_PERMISSIONS_INVALID', file, 'only contents: read is permitted'),
    );
  }
  if (object(workflow.env).CANDIDATE_SHA !== CANDIDATE_SHA_EXPRESSION) {
    findings.push(
      finding(
        'CI_CANDIDATE_SHA_UNBOUND',
        file,
        'CANDIDATE_SHA must select pull-request head SHA or github.sha exactly',
      ),
    );
  }

  const jobs = object(workflow.jobs);
  if (Object.keys(jobs).length !== 1 || jobs['verify-ledger'] === undefined) {
    findings.push(
      finding('CI_LEDGER_JOB_SET_INVALID', file, 'exactly one verify-ledger job is required'),
    );
  }
  const job = object(jobs['verify-ledger']);
  const steps = Array.isArray(job.steps) ? job.steps.map(object) : [];
  if (steps.length === 0) {
    findings.push(finding('CI_LEDGER_STEPS_MISSING', file, 'verify-ledger has no steps'));
    return;
  }

  for (const [index, step] of steps.entries()) {
    const location = `jobs.verify-ledger.steps[${String(index)}]`;
    const uses = typeof step.uses === 'string' ? step.uses : '';
    if (uses.startsWith('./')) {
      findings.push(
        finding('CI_CANDIDATE_LOCAL_VERIFIER_FORBIDDEN', file, `${location} uses ${uses}`),
      );
    } else if (uses !== '' && !/@[0-9a-f]{40}$/u.test(uses)) {
      findings.push(finding('CI_ACTION_REFERENCE_MUTABLE', file, `${location} uses ${uses}`));
    }
    const run = typeof step.run === 'string' ? step.run : '';
    if (PRODUCT_EXECUTION.some((pattern) => pattern.test(run))) {
      findings.push(
        finding('CI_PRODUCT_EXECUTION_FORBIDDEN', file, `${location} runs product tooling`),
      );
    }
    if (
      /(?:scripts|packages|candidate)\/[A-Za-z0-9_./-]*(?:verify|verifier)/iu.test(run) ||
      (/\bnode\s+[^\n]*(?:verify|verifier)/iu.test(run) &&
        !run.includes('node .devai-verifier/src/cli.js'))
    ) {
      findings.push(
        finding('CI_CANDIDATE_LOCAL_VERIFIER_FORBIDDEN', file, `${location} invokes local code`),
      );
    }
  }

  const checkouts = steps.filter((step) =>
    typeof step.uses === 'string' ? step.uses.startsWith('actions/checkout@') : false,
  );
  const candidateCheckout = checkouts.find((step) => object(step.with).path === 'candidate');
  if (
    candidateCheckout === undefined ||
    object(candidateCheckout.with).ref !== '${{ env.CANDIDATE_SHA }}' ||
    object(candidateCheckout.with).repository !== undefined ||
    object(candidateCheckout.with)['persist-credentials'] !== false
  ) {
    findings.push(
      finding('CI_CANDIDATE_CHECKOUT_UNBOUND', file, 'candidate checkout must use exact SHA'),
    );
  }
  const verifierCheckout = checkouts.find(
    (step) => object(step.with).repository === VERIFIER_REPOSITORY,
  );
  if (verifierCheckout === undefined) {
    findings.push(
      finding('CI_VERIFIER_CHECKOUT_MISSING', file, `missing ${VERIFIER_REPOSITORY} checkout`),
    );
  } else {
    const withValues = object(verifierCheckout.with);
    if (withValues.ref !== VERIFIER_COMMIT) {
      findings.push(
        finding(
          /^[0-9a-f]{40}$/u.test(String(withValues.ref ?? ''))
            ? 'CI_VERIFIER_PIN_MISMATCH'
            : 'CI_VERIFIER_REF_MUTABLE',
          file,
          `verifier ref must be ${VERIFIER_COMMIT}`,
        ),
      );
    }
    if (withValues.path !== '.devai-verifier' || withValues['persist-credentials'] !== false) {
      findings.push(
        finding(
          'CI_VERIFIER_CHECKOUT_INVALID',
          file,
          'verifier must use isolated credential-free path',
        ),
      );
    }
  }

  const serialized = JSON.stringify(workflow);
  const externalInputs = [
    'secrets.DEVAI_LEDGER_ENVELOPE_B64',
    'secrets.DEVAI_LEDGER_RESULTS_TGZ_B64',
    'secrets.DEVAI_LEDGER_TASK_POLICY_B64',
    'secrets.DEVAI_LEDGER_TRUST_STORE_B64',
    'vars.DEVAI_LEDGER_POLICY_DIGEST',
  ];
  for (const input of externalInputs) {
    if (!serialized.includes(input)) {
      findings.push(finding('CI_EXTERNAL_CONTROL_INPUT_MISSING', file, input));
    }
  }
  if (
    /(?:record\/|\.devai\/state|candidate\/)[^"'\s]*(?:receipt|result|policy|trust|ledger)/iu.test(
      serialized,
    )
  ) {
    findings.push(
      finding(
        'CI_CANDIDATE_CONTROL_INPUT_FORBIDDEN',
        file,
        'verification authority must not come from candidate files',
      ),
    );
  }

  const verifierRun = steps
    .map((step) => (typeof step.run === 'string' ? step.run : ''))
    .find((run) => run.includes('node .devai-verifier/src/cli.js'));
  if (verifierRun === undefined) {
    findings.push(
      finding('CI_VERIFIER_INVOCATION_MISSING', file, 'pinned verifier CLI is not invoked'),
    );
  } else {
    for (const binding of [
      '--repository "${{ github.repository }}"',
      '--commit "$CANDIDATE_SHA"',
      '--tree "${{ steps.candidate.outputs.tree }}"',
      '--policy-digest "$POLICY_DIGEST"',
    ]) {
      if (!verifierRun.includes(binding)) {
        findings.push(finding('CI_VERIFIER_BINDING_MISSING', file, binding));
      }
    }
  }
}

function printResult(result) {
  if (result.ok) {
    process.stdout.write('workflow contract: PASS\n');
    return;
  }
  for (const item of result.findings) {
    process.stderr.write(`${item.code}: ${item.file}: ${item.detail}\n`);
  }
  process.exitCode = 1;
}

const invokedPath = process.argv[1] === undefined ? '' : resolve(process.argv[1]);
if (invokedPath === fileURLToPath(import.meta.url)) {
  printResult(checkWorkflowTree(process.cwd()));
}
