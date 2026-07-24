import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import type { CAC } from 'cac';
import { appendVerbEvidence, initChain, loadChain } from '#core-compat';
import { mkdirSync, rmSync, writeFileSync } from '@devai-nyx/authority';
import { parsers, SchemaParseError } from '@devai-nyx/schemas';
import type { SensorReading } from '@devai-nyx/sensors';
import { EXIT_CONFIG, EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

interface RecordOptions {
  readonly repoRoot?: string;
  readonly input?: string;
  readonly human?: boolean;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export const senseReadingsRecordCmd = defineCommand({
  name: 'sense readings-record',
  description:
    'Validate and idempotently persist one exact SensorReading artifact with chained provenance',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'sense-readings-record',
        'Persist an explicitly supplied SensorReading and append one evidence record',
      )
      .option('--repo-root <path>', 'Repository root (default: .)')
      .option('--input <path>', 'Exact SensorReading JSON artifact to persist')
      .option('--human', 'Human-readable summary')
      .action((options: RecordOptions) => {
        if (options.input === undefined) {
          process.stderr.write('devai sense readings record: --input is required\n');
          process.exitCode = EXIT_USAGE;
          return;
        }
        const repoRoot = resolve(options.repoRoot ?? '.');
        const inputPath = resolve(options.input);
        try {
          const raw = readFileSync(inputPath, 'utf8');
          const reading = parsers.sensorReading.parseJson(raw) as SensorReading;
          const contentHash = sha256(raw);
          const target = join(
            repoRoot,
            '.devai/state/sensor-readings',
            reading.sensor.kind,
            `${contentHash}.json`,
          );
          const chainPath = join(repoRoot, 'record/proofs/chain.json');
          const stateRoot = join(repoRoot, '.devai/state');
          const stateExisted = existsSync(stateRoot);
          const chainExisted = existsSync(chainPath);

          if (existsSync(target) && readFileSync(target, 'utf8') !== raw) {
            throw new Error(`content-address collision at ${target}`);
          }

          initChain(chainPath);
          const relativeTarget = relative(repoRoot, target).replaceAll('\\', '/');
          const chain = loadChain(chainPath);
          const alreadyChained = chain.records.some(
            (record) =>
              record.action === 'sense.readings.record' &&
              record.artifacts.some(
                (artifact) => artifact.path === relativeTarget && artifact.sha256 === contentHash,
              ),
          );

          const targetExisted = existsSync(target);
          if (!targetExisted) {
            mkdirSync(dirname(target), { recursive: true });
            writeFileSync(target, raw, 'utf8');
          }
          if (!alreadyChained) {
            const appended = appendVerbEvidence({
              repoRoot,
              chainPath,
              action: 'sense.readings.record',
              status: 'completed',
              artifacts: [{ path: relativeTarget, sha256: contentHash, kind: 'sensor-reading' }],
              notes: [
                `sensor_id=${reading.id}`,
                `sensor_kind=${reading.sensor.kind}`,
                `input=${relative(repoRoot, inputPath).replaceAll('\\', '/')}`,
              ],
            });
            if (!appended.ok) {
              if (!stateExisted) {
                rmSync(stateRoot, { recursive: true, force: true });
              } else {
                if (!targetExisted) rmSync(target, { force: true });
                if (!chainExisted) rmSync(chainPath, { force: true });
              }
              throw new Error(`evidence append failed: ${appended.error ?? 'unknown error'}`);
            }
          }

          const output = {
            ok: true,
            recorded: !alreadyChained,
            idempotent_replay: alreadyChained,
            reading_id: reading.id,
            reading_path: target,
            sha256: contentHash,
          };
          process.stdout.write(
            options.human === true
              ? `sense readings record: ${alreadyChained ? 'already recorded' : 'recorded'} ${reading.id} (${relativeTarget})\n`
              : `${JSON.stringify(output)}\n`,
          );
          process.exitCode = EXIT_PASS;
        } catch (error) {
          process.stderr.write(
            `devai sense readings record: ${error instanceof Error ? error.message : String(error)}\n`,
          );
          process.exitCode = error instanceof SchemaParseError ? EXIT_CONFIG : EXIT_FAIL;
        }
      });
  },
});
