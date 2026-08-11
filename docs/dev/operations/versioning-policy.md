# Versioning policy

The v1.0 release candidate publishes one package, `@devai-nyx/cli`, and documents its current
41-action surface.

Pin adopter installations to an exact RC version. Any change to action identity, effect,
authority, schema, configuration, receipt, or task-policy semantics requires explicit review and
a version decision before publication. Human maintainers alone authorize package, tag, release,
or deployment effects.

Use `devai release status`, `devai release drift`, `devai release check`, and
`devai release verify` to inspect the candidate. Those results are inputs to the release decision,
not the decision itself.
