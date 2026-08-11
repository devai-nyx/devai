#!/usr/bin/env node

import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rolldown } from 'rolldown';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(packageRoot, '../..');
const distRoot = join(packageRoot, 'dist');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'devai-cli-assembly-'));
const bundlePath = join(temporaryRoot, 'bin.js');
const scaffoldModule = join(repositoryRoot, 'packages/skills/dist/operations/scaffold/index.js');

const workspacePackage = /^@devai-nyx\//u;
const external = (id) =>
  id.startsWith('node:') ||
  (!id.startsWith('.') && !id.startsWith('/') && !id.startsWith('#') && !workspacePackage.test(id));

try {
  const bundle = await rolldown({
    input: join(distRoot, 'bin.js'),
    external,
    plugins: [
      {
        name: 'relocate-packaged-operation-resources',
        transform(code, id) {
          if (id !== scaffoldModule) return null;
          const authored = '../../../resources/operations/scaffold';
          const packaged = '../../resources/operations/scaffold';
          if (!code.includes(authored)) throw new Error('PACKAGE_OPERATION_PATH_NOT_FOUND');
          return { code: code.replace(authored, packaged), map: null };
        },
      },
    ],
    resolve: {
      alias: {
        '#core-compat': join(distRoot, 'core-compat.js'),
      },
    },
    treeshake: true,
  });
  const output = await bundle.write({
    file: bundlePath,
    format: 'esm',
    codeSplitting: false,
    sourcemap: false,
  });
  const reachableSources = output.output
    .flatMap((item) => (item.type === 'chunk' ? item.moduleIds : []))
    .filter((id) => id.startsWith(repositoryRoot))
    .map((id) => {
      const sourceBase = id.replace('/dist/', '/src/').replace(/\.js$/u, '');
      const source = ['.ts', '.tsx', '.js', '.mjs', '.cjs']
        .map((extension) => sourceBase + extension)
        .find((candidate) => existsSync(candidate));
      if (source === undefined) throw new Error(`PACKAGE_SOURCE_MAPPING_MISSING:${id}`);
      return source.slice(repositoryRoot.length + 1);
    })
    .sort();
  const coverageManifest = join(repositoryRoot, 'scratch/coverage/rc-reachable-sources.json');
  mkdirSync(dirname(coverageManifest), { recursive: true });
  writeFileSync(
    coverageManifest,
    JSON.stringify({ schemaVersion: '1.0.0', sources: reachableSources }, null, 2) + '\n',
  );
  await bundle.close();

  rmSync(distRoot, { recursive: true, force: true });
  const runtimeRoot = join(distRoot, 'runtime');
  const runtimeIndex = join(runtimeRoot, 'index');
  mkdirSync(runtimeIndex, { recursive: true });
  cpSync(bundlePath, join(runtimeIndex, 'bin.js'));
  chmodSync(join(runtimeIndex, 'bin.js'), 0o755);

  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  writeFileSync(
    join(runtimeRoot, 'package.json'),
    JSON.stringify({ type: 'module', version: manifest.version }, null, 2) + '\n',
  );

  cpSync(join(repositoryRoot, 'law/schemas'), join(runtimeIndex, 'schemas'), {
    recursive: true,
  });
  for (const name of ['sensor-registry.json', 'round-execution.json', 'sense-presets.json']) {
    cpSync(join(repositoryRoot, 'law/policy', name), join(runtimeIndex, name));
  }

  mkdirSync(join(distRoot, 'law'), { recursive: true });
  cpSync(join(repositoryRoot, 'law/constitution.md'), join(distRoot, 'law/constitution.md'));
  mkdirSync(join(runtimeRoot, 'law'), { recursive: true });
  cpSync(join(repositoryRoot, 'law/constitution.md'), join(runtimeRoot, 'law/constitution.md'));
  cpSync(join(repositoryRoot, 'law/policy'), join(distRoot, 'law/policy'), { recursive: true });
  cpSync(join(repositoryRoot, 'packages/skills/resources'), join(distRoot, 'resources'), {
    recursive: true,
  });

  const required = [
    join(runtimeIndex, 'bin.js'),
    join(runtimeIndex, 'schemas/action-result.schema.json'),
    join(runtimeIndex, 'sensor-registry.json'),
    join(runtimeIndex, 'round-execution.json'),
    join(runtimeIndex, 'sense-presets.json'),
    join(distRoot, 'law/constitution.md'),
    join(distRoot, 'resources/recipes/devai-round/SKILL.md'),
    join(distRoot, 'resources/operations/scaffold/templates/db/migration.sql.tpl'),
  ];
  const missing = required.filter((path) => !existsSync(path));
  if (missing.length > 0) throw new Error(`PACKAGE_ASSET_MISSING:${missing.join(',')}`);
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
