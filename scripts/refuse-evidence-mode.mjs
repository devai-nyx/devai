#!/usr/bin/env node

/**
 * Bootstrap evidence-mode sentinel.
 *
 * Local evidence reuse is not authorized at genesis. BL-022 must first bind
 * first-parent authorization to successor records, and BL-038 must re-earn
 * promotion from zero. Any truthy request therefore fails closed.
 */

const requested = (process.env.EVIDENCE_MODE ?? 'false').trim().toLowerCase();
const disabled = new Set(['', '0', 'false', 'no', 'off']);

if (!disabled.has(requested)) {
  process.stdout.write('evidence_mode=false\n');
  process.stderr.write(
    'SKIPPED-RED: evidence_mode is unavailable until BL-022 and BL-038 close; full execution is required.\n',
  );
  process.exit(2);
}

process.stdout.write(
  'evidence_mode=false (bootstrap fail-closed sentinel; full execution required by BL-022/BL-038)\n',
);
