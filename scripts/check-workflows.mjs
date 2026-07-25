#!/usr/bin/env node

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseDocument, isMap } from 'yaml';

const workflowDir = join(process.cwd(), '.github', 'workflows');
const files = readdirSync(workflowDir)
  .filter((name) => /\.ya?ml$/u.test(name))
  .sort();
const findings = [];

function visit(value, path, file) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, `${path}[${String(index)}]`, file));
    return;
  }
  if (value === null || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    const childPath = path.length === 0 ? key : `${path}.${key}`;
    if (key === 'paths' || key === 'paths-ignore') {
      findings.push(`${file}: ${childPath} may silently skip a required gate`);
    }
    visit(child, childPath, file);
  }
}

for (const file of files) {
  const source = readFileSync(join(workflowDir, file), 'utf8');
  const document = parseDocument(source, { uniqueKeys: true });
  if (document.errors.length > 0) {
    for (const error of document.errors) findings.push(`${file}: ${error.message}`);
    continue;
  }
  if (!isMap(document.contents)) {
    findings.push(`${file}: workflow root must be a mapping`);
    continue;
  }
  const workflow = document.toJS();
  if (typeof workflow.name !== 'string' || workflow.name.length === 0) {
    findings.push(`${file}: missing workflow name`);
  }
  if (workflow.on === undefined || workflow.on === null) findings.push(`${file}: missing triggers`);
  if (workflow.jobs === undefined || workflow.jobs === null) findings.push(`${file}: missing jobs`);
  visit(workflow, '', file);
  if (file === 'ci.yml' && workflow.jobs !== undefined && workflow.jobs !== null) {
    const jobs = Object.values(workflow.jobs);
    const commands = jobs.flatMap((job) =>
      Array.isArray(job.steps)
        ? job.steps.flatMap((step) => (typeof step.run === 'string' ? [step.run] : []))
        : [],
    );
    if (!commands.includes('pnpm run ci:governance')) {
      findings.push('ci.yml: required pnpm run ci:governance command is missing');
    }
    if (!jobs.some((job) => job.uses === './.github/workflows/round-gates.yml')) {
      findings.push('ci.yml: required automatic round-gates workflow call is missing');
    }
  }
}

if (files.length === 0) findings.push('no workflow files found');

if (findings.length > 0) {
  process.stderr.write(`workflow lint: FAIL\n${findings.map((f) => `- ${f}`).join('\n')}\n`);
  process.exit(1);
}

process.stdout.write(`workflow lint: PASS (${String(files.length)} workflow files)\n`);
