# Semantic versioning

Due to the nature of stylelint as a code quality tool, we follow a specific flavor of [semantic versioning](http://semver.org).

Any minor update may report more errors than the previous release. As such, we recommend using the tilde (`~`) in `package.json` e.g. `"stylelint": "~7.2.0"` to guarantee the results of your builds.

## Patch release

Intended not to break your lint build:

- a bug fix in a rule that results in stylelint reporting fewer errors
- a bug fix to the CLI or core (including formatters)
- improvements to documentation
- non-user-facing changes such as refactoring code or modifying tests
- re-releasing after a failed release (i.e., publishing a release that doesn't work for anyone)

## Minor release

Might break your lint build:

- a bug fix in a rule that results in stylelint reporting more errors
- a new rule is created
- a new option to an existing rule that does not result in stylelint reporting more errors by default
- an existing rule is deprecated
- a new CLI capability is created
- a new public API capability is created
- a new formatter is created

## Major release

Likely to break your lint build:

- a change in the documented behavior of an existing rule results in stylelint reporting more errors by default
- an existing rule is removed
- an existing formatter is removed
- part of the CLI is removed or changed in an incompatible way
- part of the public API is removed or changed in an incompatible way
