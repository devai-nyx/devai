# Sensor design notes

This directory is the canonical reference for the per-sensor _operational definitions_ that govern Phase 27+ sensor kinds. Each `<kind>.md` file answers four questions for one sensor kind:

1. **Property semantics.** What does the T-axis property (Article 5) mean for this substrate?
2. **Operational definition.** What does the sensor concretely measure?
3. **PASS/REVIEW/FAIL boundaries.** Threshold values + reasoning.
4. **Adopter overrides.** Which pack-config keys let adopters tune?
5. **Out of scope.** Deferred concerns + which future cell picks them up.

Substrate introduced in Phase 27 (D-79). Phase 28+ sensor additions must include a design note here.

The 1-page template:

```markdown
# Sensor: <kind> → <substrate>×<property>

## Property semantics

(Quote Article 5 + extend per-substrate.)

## Operational definition

(What the sensor concretely measures.)

## PASS / REVIEW / FAIL boundaries

- **PASS:** ...
- **REVIEW:** ...
- **FAIL:** ...

## Adopter overrides

(Pack config keys.)

## Out of scope

(Deferred concerns.)
```
