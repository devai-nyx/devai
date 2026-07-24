import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = join(packageRoot, '..', '..');
const outputRoot = join(packageRoot, 'dist');

mkdirSync(outputRoot, { recursive: true });
copyFileSync(
  join(repositoryRoot, 'law', 'policy', 'sensor-registry.json'),
  join(outputRoot, 'sensor-registry.json'),
);
