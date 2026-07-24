import type { RoundVerdict } from '../types.js';

/**
 * R10 (D-A-40 / ADR Decision 2) — five-state verdict taxonomy with
 * precedence: failed > aborted > with-blockers > partial > deferred > clean.
 */
export function computeRoundVerdict(inputs: {
  readonly gateFailCount: number;
  readonly waveStatuses: ReadonlyArray<{ status: string }>;
  readonly blockersCount: number;
  readonly deferredCount: number;
  readonly failedExecution?: boolean;
}): RoundVerdict {
  if (inputs.failedExecution === true) return 'failed';
  const anyAborted = inputs.waveStatuses.some((w) => w.status === 'aborted');
  if (anyAborted) return 'aborted';
  const hasBlockerOrGateFail = inputs.gateFailCount > 0 || inputs.blockersCount > 0;
  if (hasBlockerOrGateFail) return 'with-blockers';
  const anyClean = inputs.waveStatuses.some((w) => w.status === 'clean');
  const anyMixedNotClean = inputs.waveStatuses.some(
    (w) => w.status !== 'clean' && w.status !== 'skipped',
  );
  if (anyClean && (anyMixedNotClean || inputs.deferredCount > 0)) {
    if (anyMixedNotClean) return 'partial';
    return 'partial';
  }
  if (inputs.deferredCount > 0) return 'deferred';
  return 'clean';
}
