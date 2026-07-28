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
} from './action-output.js';
import { actionsList } from './commands/actions-list.js';
import { blueprintDiff, blueprintPlan, blueprintValidate } from './commands/blueprint/index.js';
import { rgrEmit, rgrList, rgrResolve, rgrShow } from './commands/rgr/index.js';
import {
  releaseGate,
  releaseList,
  releasePostdeployVerify,
  releaseRuntimeDrift,
} from './commands/release/index.js';
import {
  senseRuntimeApi,
  senseRuntimeAuth,
  senseRuntimeData,
} from './commands/sense/runtime-probe.js';
import { rtdBundle } from './commands/rtd/index.js';
import {
  docsCli,
  docsDecisionsRender,
  docsLinks,
  docsPublish,
  docsRenderMermaid,
  docsRoundsRender,
  docsSynthesize,
  docsSynthesizeAll,
} from './commands/docs/index.js';
import { roundArchive, roundDeclare, roundScaffold, roundStatus } from './commands/round/index.js';
import { decisionClose } from './commands/decision/index.js';
import { phaseClose, phaseLedger } from './commands/phase/index.js';
import { renderMatrix } from './commands/render/index.js';
import { recordRun } from './commands/record/index.js';
import { coverageAggregate } from './commands/coverage/index.js';
import { mutationRun, mutationVerify } from './commands/mutation/index.js';
import { doctor } from './commands/doctor.js';
import {
  initApplyArchitect,
  initApplyF5,
  initApplyOwner,
  initPlan,
  upgrade,
} from './commands/init/index.js';
import { ciScaffold } from './commands/ci/index.js';
import { hooksInstall } from './commands/hooks/index.js';
import { skillList, skillRun } from './commands/skill/index.js';
import { statePrune } from './commands/state/index.js';
import { workSessionEnd, workSessionStart } from './commands/work/session.js';
import {
  evidenceActionsVerify,
  evidenceChainHead,
  evidenceCollectLocal,
  evidenceEmit,
  evidenceRedact,
  evidenceVerify,
  evidenceVerifyLocal,
} from './commands/evidence/index.js';
import {
  invAdherenceReverse,
  invComponents,
  invContracts,
  invCoverage,
  invDependencies,
  invGlossary,
  invModules,
  invRegen,
  invRoutes,
  invSchemas,
  invSuggest,
  invTests,
} from './commands/inv/index.js';
import {
  dbDrop,
  dbProvision,
  dbRebuildTemplate,
  dbStartShared,
  dbStatus,
  dbStopShared,
  lockAcquire,
  lockList,
  lockReap,
  lockRelease,
  taskComplete,
  taskEscalate,
  taskList,
  taskPauseRgr,
  taskResumeRgr,
  taskSpawn,
  worktreeAdopt,
  worktreeCreate,
  worktreeDestroy,
  worktreeList,
  worktreeReap,
} from './commands/loop/index.js';
import {
  promptsCompose,
  promptsDiff,
  promptsFreeze,
  scoreAssess,
  scoreBacklogRefresh,
  scoreCompute,
  scoreView,
  triageClassify,
  triageDispatch,
  triageTieBreak,
} from './commands/phase6/index.js';
import {
  checkAdrs,
  checkActionEffectsCmd,
  checkCiEconomyCmd,
  checkDocsGovernanceCmd,
  checkDependenciesCmd,
  checkForbiddenActions,
  checkGlobGuardsCmd,
  checkOverrides,
  checkPrComplianceCmd,
  checkPromptOverlaysCmd,
  checkSensorIntegrityCmd,
  registerCheckSchemas,
} from './commands/check/index.js';
import { governAuditorPostMergeCmd } from './commands/govern/post-merge-auditor.js';
import { llmProbe } from './commands/llm/index.js';
import { packGraduateInvariants, packResolve } from './commands/pack/index.js';
import {
  backlogAdd,
  backlogCompact,
  backlogComplete,
  backlogList,
  backlogNext,
  loopRun,
} from './commands/loop-run/index.js';
import {
  senseBuildCmd,
  senseInventoryApiCmd,
  senseInventoryCoverageCmd,
  senseInventoryDataHandlingCmd,
  senseInventoryDataModelCmd,
  senseInventoryDepGraphCmd,
  senseInventoryRbacCmd,
  senseInventoryRoutesCmd,
  senseJudgeCmd,
  senseLintCmd,
  senseMigrateCheckCmd,
  senseReadingsRebuildCmd,
  senseReadingsRecordCmd,
  senseHarnessCoherenceCmd,
  senseDocsDriftCmd,
  senseArchiveImmutabilityCmd,
  senseDecisionCitationResolutionCmd,
  senseDecisionRecordIntegrityCmd,
  senseSiteDriftCmd,
  senseHarnessCoverageCmd,
  senseHarnessDepthCmd,
  senseHarnessGreenMainCmd,
  senseHarnessIdiomaticityCmd,
  senseHarnessInvariantAlignmentCmd,
  senseHarnessPerformanceCmd,
  senseHarnessRobustnessCmd,
  senseHarnessSecurityCmd,
  senseInventoryAdherenceCmd,
  senseInventoryPerformanceCmd,
  senseInventoryDeterminismCmd,
  sensePerfTestCmd,
  senseSecurityScanCmd,
  sensePlantCoherenceCmd,
  sensePlantCoverageCmd,
  sensePlantDepthCmd,
  senseSpecAlignmentCmd,
  senseSpecDepthCmd,
  senseSpecPerformanceTargetsCmd,
  senseSpecRobustnessTargetsCmd,
  senseSpecSecurityCoverageCmd,
  senseSpecFreshnessCmd,
  senseSpecIdiomaticityCmd,
  senseTestCmd,
  senseTestCoherenceCmd,
  senseTestCoverageDepthCmd,
  senseTestIdiomaticityCmd,
  senseTestPerformanceCoverageCmd,
  senseTestRobustnessCoverageCmd,
  senseTestSecurityCoverageCmd,
  senseTestInvariantAlignmentCmd,
  senseTestWeakeningCmd,
  senseTraceResolveCmd,
  senseTypeCheckCmd,
  senseRunSetCmd,
  senseRoundRecordIntegrityCmd,
} from './commands/sense/index.js';
import {
  specValidateActionCoverage,
  specValidateAll,
  specValidateGlossary,
  specValidateInvariants,
  specValidateInvariantStrategies,
  specValidateJourneys,
  specValidateSchema,
  specValidateTrace,
  specValidateTestTrace,
} from './commands/spec/index.js';
import { verifyTranslation } from './commands/verify/index.js';

const pkgVersion = resolveCliVersion();

const cli = cac('devai');
cli.version(pkgVersion);
cli.help();

actionsList.register(cli);
blueprintValidate.register(cli);
blueprintDiff.register(cli);
blueprintPlan.register(cli);
doctor.register(cli);
initPlan.register(cli);
initApplyOwner.register(cli);
initApplyArchitect.register(cli);
initApplyF5.register(cli);
ciScaffold.register(cli);
hooksInstall.register(cli);
skillList.register(cli);
skillRun.register(cli);
upgrade.register(cli);
evidenceChainHead.register(cli);
evidenceActionsVerify.register(cli);
evidenceCollectLocal.register(cli);
evidenceEmit.register(cli);
evidenceRedact.register(cli);
evidenceVerify.register(cli);
evidenceVerifyLocal.register(cli);
invAdherenceReverse.register(cli);
invComponents.register(cli);
invContracts.register(cli);
invCoverage.register(cli);
invDependencies.register(cli);
invGlossary.register(cli);
invModules.register(cli);
invRegen.register(cli);
invRoutes.register(cli);
invSchemas.register(cli);
invSuggest.register(cli);
invTests.register(cli);
dbDrop.register(cli);
dbProvision.register(cli);
dbRebuildTemplate.register(cli);
dbStartShared.register(cli);
dbStopShared.register(cli);
dbStatus.register(cli);
lockAcquire.register(cli);
lockList.register(cli);
lockReap.register(cli);
lockRelease.register(cli);
senseBuildCmd.register(cli);
senseInventoryApiCmd.register(cli);
senseInventoryCoverageCmd.register(cli);
senseInventoryDataHandlingCmd.register(cli);
senseInventoryDataModelCmd.register(cli);
senseInventoryDepGraphCmd.register(cli);
senseInventoryRbacCmd.register(cli);
senseInventoryRoutesCmd.register(cli);
senseJudgeCmd.register(cli);
senseReadingsRebuildCmd.register(cli);
senseReadingsRecordCmd.register(cli);
senseLintCmd.register(cli);
senseSpecDepthCmd.register(cli);
senseSpecIdiomaticityCmd.register(cli);
senseSpecFreshnessCmd.register(cli);
senseSpecAlignmentCmd.register(cli);
senseSpecSecurityCoverageCmd.register(cli);
senseSpecPerformanceTargetsCmd.register(cli);
senseSpecRobustnessTargetsCmd.register(cli);
sensePlantCoverageCmd.register(cli);
sensePlantDepthCmd.register(cli);
sensePlantCoherenceCmd.register(cli);
senseTestCoverageDepthCmd.register(cli);
senseTestCoherenceCmd.register(cli);
senseTestIdiomaticityCmd.register(cli);
senseTestSecurityCoverageCmd.register(cli);
senseTestPerformanceCoverageCmd.register(cli);
senseTestRobustnessCoverageCmd.register(cli);
senseTestInvariantAlignmentCmd.register(cli);
senseInventoryAdherenceCmd.register(cli);
senseInventoryPerformanceCmd.register(cli);
senseSecurityScanCmd.register(cli);
sensePerfTestCmd.register(cli);
senseInventoryDeterminismCmd.register(cli);
senseHarnessSecurityCmd.register(cli);
senseHarnessGreenMainCmd.register(cli);
senseHarnessCoverageCmd.register(cli);
senseHarnessDepthCmd.register(cli);
senseHarnessCoherenceCmd.register(cli);
senseDocsDriftCmd.register(cli);
senseArchiveImmutabilityCmd.register(cli);
senseDecisionCitationResolutionCmd.register(cli);
senseDecisionRecordIntegrityCmd.register(cli);
senseSiteDriftCmd.register(cli);
senseHarnessInvariantAlignmentCmd.register(cli);
senseHarnessIdiomaticityCmd.register(cli);
senseHarnessPerformanceCmd.register(cli);
senseHarnessRobustnessCmd.register(cli);
senseMigrateCheckCmd.register(cli);
senseTestCmd.register(cli);
senseTestWeakeningCmd.register(cli);
senseTraceResolveCmd.register(cli);
senseTypeCheckCmd.register(cli);
senseRunSetCmd.register(cli);
senseRoundRecordIntegrityCmd.register(cli);
checkAdrs.register(cli);
checkActionEffectsCmd.register(cli);
checkCiEconomyCmd.register(cli);
checkDocsGovernanceCmd.register(cli);
checkDependenciesCmd.register(cli);
checkForbiddenActions.register(cli);
checkGlobGuardsCmd.register(cli);
checkOverrides.register(cli);
checkPrComplianceCmd.register(cli);
checkPromptOverlaysCmd.register(cli);
checkSensorIntegrityCmd.register(cli);
registerCheckSchemas(cli);
governAuditorPostMergeCmd.register(cli);
llmProbe.register(cli);
packGraduateInvariants.register(cli);
packResolve.register(cli);
loopRun.register(cli);
backlogAdd.register(cli);
backlogList.register(cli);
backlogNext.register(cli);
backlogComplete.register(cli);
backlogCompact.register(cli);
specValidateActionCoverage.register(cli);
specValidateAll.register(cli);
specValidateGlossary.register(cli);
specValidateInvariants.register(cli);
specValidateInvariantStrategies.register(cli);
specValidateJourneys.register(cli);
specValidateSchema.register(cli);
specValidateTrace.register(cli);
specValidateTestTrace.register(cli);
statePrune.register(cli);
workSessionStart.register(cli);
workSessionEnd.register(cli);
taskComplete.register(cli);
taskEscalate.register(cli);
taskList.register(cli);
taskPauseRgr.register(cli);
taskResumeRgr.register(cli);
taskSpawn.register(cli);
worktreeAdopt.register(cli);
worktreeCreate.register(cli);
worktreeDestroy.register(cli);
worktreeList.register(cli);
worktreeReap.register(cli);
promptsCompose.register(cli);
promptsDiff.register(cli);
promptsFreeze.register(cli);
scoreAssess.register(cli);
scoreBacklogRefresh.register(cli);
scoreCompute.register(cli);
scoreView.register(cli);
triageClassify.register(cli);
triageDispatch.register(cli);
triageTieBreak.register(cli);
rgrEmit.register(cli);
rgrList.register(cli);
rgrShow.register(cli);
rgrResolve.register(cli);
releaseGate.register(cli);
releaseList.register(cli);
releasePostdeployVerify.register(cli);
releaseRuntimeDrift.register(cli);
senseRuntimeApi.register(cli);
senseRuntimeAuth.register(cli);
senseRuntimeData.register(cli);
rtdBundle.register(cli);
docsCli.register(cli);
docsDecisionsRender.register(cli);
docsLinks.register(cli);
docsPublish.register(cli);
docsRenderMermaid.register(cli);
docsRoundsRender.register(cli);
docsSynthesize.register(cli);
docsSynthesizeAll.register(cli);
decisionClose.register(cli);
phaseClose.register(cli);
phaseLedger.register(cli);
renderMatrix.register(cli);
recordRun.register(cli);
coverageAggregate.register(cli);
roundScaffold.register(cli);
roundDeclare.register(cli);
roundStatus.register(cli);
roundArchive.register(cli);
mutationRun.register(cli);
mutationVerify.register(cli);
verifyTranslation.register(cli);

attachRuntimeContracts(cli.commands);
const registry = getFullRegistry();
const machineAction = publicActionForArgv(process.argv, registry);
try {
  validateActionSurface(registry);
  validateLiveAuthorityActionRegistry(registry);
  attachAuthorityCommandBoundaries(cli.commands, registry);
  attachActionOutputBoundaries(cli.commands, registry);
  const route = routeArgv(stripAuthorityArgv(process.argv), registry, pkgVersion);
  if (route.kind === 'output') {
    if (
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
    const authorityResult = authorizeCliArgv(
      process.argv,
      registry,
      (skillId) => getSkill(skillId)?.manifest.authority_role,
    );
    if (authorityResult !== undefined) {
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
      cli.parse(route.argv);
    }
  }
} catch (err) {
  // R18.C.4 (D-133/M3) and DII-243: every failure before or during dispatch
  // remains inside the selected public action's machine boundary.
  const usage = err instanceof Error && err.name === 'CACError';
  const exit = usage ? 2 : 6;
  const text = `devai: ${err instanceof Error ? err.message : String(err)}\n`;
  if (!emitPreDispatchActionResult(machineAction, { exit, stdout: '', stderr: text })) {
    if (usage) {
      process.stderr.write(text);
      process.exitCode = exit;
    } else {
      throw err;
    }
  }
}
