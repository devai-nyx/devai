import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AnySchema, ErrorObject } from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type { CAC } from 'cac';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

interface Options {
  readonly schema?: string;
  readonly file?: string;
}

interface ValidationEnvelope {
  readonly ok: boolean;
  readonly schema: string;
  readonly file: string;
  readonly errors: readonly (ErrorObject | { readonly message: string })[];
}

function emit(payload: ValidationEnvelope, exitCode: number): void {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
  process.exitCode = exitCode;
}

export const specValidateSchema = defineCommand({
  name: 'spec validate-schema',
  description: 'Validate one JSON instance against one explicit Draft 2020-12 schema',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command(
        'spec-validate-schema',
        'Validate one JSON instance against one explicit Draft 2020-12 schema',
      )
      .option('--schema <path>', 'Path to the JSON Schema')
      .option('--file <path>', 'Path to the JSON instance')
      .action((options: Options) => {
        const schemaPath = resolve(options.schema ?? '');
        const filePath = resolve(options.file ?? '');
        try {
          if (options.schema === undefined || options.file === undefined) {
            throw new Error('both --schema and --file are required');
          }
          const schema: unknown = JSON.parse(readFileSync(schemaPath, 'utf8'));
          const instance: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
          const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true, strict: false });
          addFormats(ajv);
          const validate = ajv.compile(schema as AnySchema);
          const result = validate(instance);
          if (typeof result !== 'boolean') {
            throw new Error('asynchronous schemas are not supported');
          }
          const ok = result;
          emit(
            {
              ok,
              schema: schemaPath,
              file: filePath,
              errors: ok ? [] : (validate.errors ?? []),
            },
            ok ? EXIT_PASS : EXIT_FAIL,
          );
        } catch (error) {
          emit(
            {
              ok: false,
              schema: schemaPath,
              file: filePath,
              errors: [{ message: error instanceof Error ? error.message : String(error) }],
            },
            EXIT_FAIL,
          );
        }
      });
  },
});
