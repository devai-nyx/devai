import { executeScaffoldOperation } from './scaffold/index.js';
import type { OperationCommandRunner, OperationHost, OperationHostRequest } from './types.js';

export function createOperationHost(commandRunner: OperationCommandRunner): OperationHost {
  return Object.freeze({
    execute(request: OperationHostRequest) {
      if (request.definition.execution === 'host-scaffolder') {
        return executeScaffoldOperation(request);
      }
      const argv = request.definition.argv;
      if (argv === undefined) throw new Error(`OPERATION_COMMAND_MISSING:${request.operation}`);
      return commandRunner.run({
        argv,
        cwd: request.repo_root,
        effect: request.definition.effect,
        write_paths: request.write_paths ?? [],
      });
    },
  });
}
