import type { CAC } from 'cac';
import { discoverSchemas } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, buildIgnoreDirs, emit, type CommonInvOptions } from './shared.js';

interface Options extends CommonInvOptions {
  /** cac maps `--no-db` to `db: false`. */
  readonly db?: boolean;
  readonly databaseUrl?: string;
  readonly databaseSchema?: string;
}

export const invSchemas = defineCommand({
  name: 'inv schemas',
  description: 'Discover JSON Schema, OpenAPI files, and (optionally) Postgres tables/views',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'inv-schemas',
        'Discover JSON Schema / OpenAPI files; --database-url enables Postgres introspection',
      )
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--no-db', 'Skip Postgres introspection (default; opt in via --database-url)')
      .option(
        '--database-url <url>',
        'Postgres URL (e.g. postgres://user:pass@host:5432/db). Introspects information_schema.tables.',
      )
      .option(
        '--database-schema <name>',
        'Postgres schema-name filter (e.g. public); when omitted every non-system schema is included',
      )
      .option('--human', 'Human-readable output')
      .option('--ignore-dir <name>', 'Extra directory name to skip (repeatable)')
      .option('--include-ignored <name>', 'Directory name to un-ignore (repeatable)')
      .action(async (options: Options) => {
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const ignoreDirs = buildIgnoreDirs(options);
          // --no-db wins over --database-url for safety. The Phase-3 default
          // behavior is "no DB introspection unless explicitly asked for".
          // Users opt in by supplying --database-url without --no-db.
          const noDb = options.db === false || options.databaseUrl === undefined;
          const records = await discoverSchemas({
            repoRoot,
            ignoreDirs,
            noDb,
            ...(options.databaseUrl !== undefined && { databaseUrl: options.databaseUrl }),
            ...(options.databaseSchema !== undefined && {
              databaseSchema: options.databaseSchema,
            }),
          });
          emit(
            { count: records.length, schemas: records },
            options.human === true,
            `inv schemas: ${String(records.length)} schema(s)\n${records
              .map(
                (s) =>
                  `  ${s.kind.padEnd(12)} ${s.name}${
                    s.db_schema !== undefined ? `  [${s.db_schema}]` : ''
                  }${s.path !== undefined ? `  (${s.path})` : ''}`,
              )
              .join('\n')}`,
          );
          process.exitCode = EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai inventory schemas: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});
