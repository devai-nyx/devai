---
name: devai-assess
description: Assess repository state and explain current evidence without changing product files.
---

# DEVAI assess

Use this recipe for a concise, evidence-based repository assessment.

1. Select exactly one declared variant: `health`, `inventory`, or `round`.
2. Run only the deterministic DEVAI operation declared for that variant.
3. Read the complete result before summarizing it.
4. Separate observed facts, gaps, and recommendations.
5. Do not edit files, invoke another model, or advance a round.

Return the selected variant, operations run, evidence considered, findings, and unresolved gaps.
