#!/usr/bin/env node
import { cac } from 'cac';
import { getSkill } from '#core-compat';
import { routeArgv } from './command-router.js';
import {
  attachRuntimeContracts,
  getFullRegistry,
  validateActionSurface,
} from './define-command.js';
import {
  authorizeCliArgv,
  attachAuthorityCommandBoundaries,
  stripAuthorityArgv,
  validateLiveAuthorityActionRegistry,
} from './authority/index.js';
import { resolveCliVersion } from './version.js';
import {
  attachActionOutputBoundaries,
  emitPreDispatchActionResult,
  publicActionForArgv,
  runCliStage,
} from './action-output.js';
import { actionsList } from './commands/actions-list.js';
import { checkCmd } from './commands/check/facade.js';
import { doctor } from './commands/doctor.js';
import {
  evidenceCollect,
  evidenceRecord,
  evidenceRedact,
  evidenceRender,
  evidenceVerify,
} from './commands/evidence/facade.js';
import {
  initApplyArchitect,
  initApplyHarness,
  initApplyOwner,
  initPlan,
  initUpgrade,
} from './commands/init/index.js';
import {
  releaseCheck,
  releaseDrift,
  releasePublishDocs,
  releaseStatus,
  releaseVerify,
} from './commands/release/facade.js';
import {
  roundAssess,
  roundClose,
  roundGapCreate,
  roundGapList,
  roundGapResolve,
  roundGapShow,
  roundPlan,
  roundRun,
  roundSeal,
  roundStatus,
} from './commands/round/workflow.js';
import { senseInventoryCmd } from './commands/sense/inventory.js';
import { senseMigrateCmd } from './commands/sense/migrate.js';
import { senseRecordCmd } from './commands/sense/record.js';
import { senseRunSetCmd } from './commands/sense/run-set.js';
import {
  taskEscalate,
  taskFinish,
  taskPause,
  taskQueueAdd,
  taskQueueComplete,
  taskQueueList,
  taskQueueNext,
  taskResume,
  taskStart,
  taskStatus,
} from './commands/task/index.js';

const pkgVersion = resolveCliVersion();

const cli = cac('devai');
cli.version(pkgVersion);
cli.help();

const canonicalCommands = [
  actionsList,
  checkCmd,
  doctor,
  evidenceCollect,
  evidenceRecord,
  evidenceRedact,
  evidenceRender,
  evidenceVerify,
  initApplyArchitect,
  initApplyHarness,
  initApplyOwner,
  initPlan,
  initUpgrade,
  releaseCheck,
  releaseDrift,
  releasePublishDocs,
  releaseStatus,
  releaseVerify,
  roundAssess,
  roundClose,
  roundGapCreate,
  roundGapList,
  roundGapResolve,
  roundGapShow,
  roundPlan,
  roundRun,
  roundSeal,
  roundStatus,
  senseInventoryCmd,
  senseMigrateCmd,
  senseRecordCmd,
  senseRunSetCmd,
  taskEscalate,
  taskFinish,
  taskPause,
  taskQueueAdd,
  taskQueueComplete,
  taskQueueList,
  taskQueueNext,
  taskResume,
  taskStart,
  taskStatus,
] as const;

for (const command of canonicalCommands) command.register(cli);

const registry = getFullRegistry();
const machineAction = publicActionForArgv(process.argv, registry);
const initialized = runCliStage(machineAction, 'initialization', () => {
  attachRuntimeContracts(cli.commands);
  attachAuthorityCommandBoundaries(cli.commands, registry);
  attachActionOutputBoundaries(cli.commands, registry);
});
if (initialized.ok) {
  const validated = runCliStage(machineAction, 'registry-validation', () => {
    validateActionSurface(registry);
    validateLiveAuthorityActionRegistry(registry);
  });
  const routed = validated.ok
    ? runCliStage(machineAction, 'routing', () =>
        routeArgv(stripAuthorityArgv(process.argv), registry, pkgVersion),
      )
    : undefined;
  const route = routed?.ok === true ? routed.value : undefined;
  if (route === undefined) {
    // The stage boundary already emitted the sole structured failure.
  } else if (route.kind === 'output') {
    if (
      route.bypassActionOutput === true ||
      !emitPreDispatchActionResult(machineAction, {
        exit: route.exitCode,
        stdout: route.exitCode === 0 ? route.text : '',
        stderr: route.exitCode === 0 ? '' : route.text,
      })
    ) {
      const stream = route.exitCode === 0 ? process.stdout : process.stderr;
      stream.write(route.text);
      process.exitCode = route.exitCode;
    }
  } else {
    const authorized = runCliStage(machineAction, 'authorization', () =>
      authorizeCliArgv(
        process.argv,
        registry,
        (skillId) => getSkill(skillId)?.manifest.authority_role,
      ),
    );
    const authorityResult = authorized.ok ? authorized.value : undefined;
    if (!authorized.ok) {
      // The stage boundary already emitted the sole structured failure.
    } else if (authorityResult !== undefined) {
      if (
        !emitPreDispatchActionResult(machineAction, {
          exit: authorityResult.exit_code,
          stdout: authorityResult.stdout,
          stderr: authorityResult.stderr,
        })
      ) {
        const stream = authorityResult.stdout.length > 0 ? process.stdout : process.stderr;
        stream.write(
          authorityResult.stdout.length > 0 ? authorityResult.stdout : authorityResult.stderr,
        );
        process.exitCode = authorityResult.exit_code;
      }
    } else {
      runCliStage(machineAction, 'handler-dispatch', () => cli.parse(route.argv));
    }
  }
}
