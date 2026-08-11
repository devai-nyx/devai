# Versioning policy

The v1.0 release candidate is a clean product boundary. It publishes one package,
`@devai-nyx/cli`, and documents only its current 41-action surface. Removed actions and packages
do not remain as aliases, tombstones, compatibility shims, or migration promises.

Pin adopter installations to an exact RC version. Any change to action identity, effect,
authority, schema, configuration, receipt, or task-policy semantics requires explicit review and
a version decision before publication. Human maintainers alone authorize package, tag, release,
or deployment effects.

Use the four current release actions—`status`, `drift`, `check`, and `verify` under
`devai release`—to inspect the candidate. Those results are inputs to the release decision, not
the decision itself.
