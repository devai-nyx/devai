#!/usr/bin/env node
import {
  CONTROL_CONCERN as runtimeConcern,
  runRoundCloseControls,
} from './round-close-controls/runtime.mjs';
import { CONTROL_CONCERN as legacyConcern } from './round-close-controls/legacy.mjs';
import { CONTROL_CONCERN as impactConcern } from './round-close-controls/impact.mjs';
import { CONTROL_CONCERN as governedConcern } from './round-close-controls/governed.mjs';
import { CONTROL_CONCERN as reviewLifecycleConcern } from './round-close-controls/review-lifecycle.mjs';

const loadedConcerns = [
  runtimeConcern,
  legacyConcern,
  impactConcern,
  governedConcern,
  reviewLifecycleConcern,
];
if (loadedConcerns.length !== 5) throw new Error('ROUND_CLOSE_CONTROL_CONCERN_MISSING');
runRoundCloseControls();
