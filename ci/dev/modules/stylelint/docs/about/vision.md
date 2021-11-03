# Vision

A linter for CSS and CSS-like languages that is:

- complete - coverage of all standard CSS syntax
- extensible - multiple points of extension
- configurable - no defaults and options to tailor the linter
- robust - comprehensive test coverage and a wide range of fixtures
- consistent - conventions for behavior, naming and documentation
- performant - tools to test and improve performance

## Complete

Provide built-in rules for standard CSS syntax that:

- [detect possible errors](../user-guide/rules/list.md#possible-errors)
- [limit language features](../user-guide/rules/list.md#limit-language-features)
- [enforce stylistic conventions](../user-guide/rules/list.md#stylistic-issues)

### Possible errors

Provide rules to catch code that is valid but likely has unintended consequences, e.g. duplicates and overrides.

### Limit language features

Provide rules to limit what language features can be used to enforce:

- a maximum specificity by limiting the overall specificity or the occurrence of different selector types, e.g. class, ID and attribute
- best practice _at the configuration level_, e.g. disallowing the `all` keyword for transitions
- the use of a subset of features to improve consistency across a codebase, e.g. limiting what units are allowed
- specific patterns for selectors and names, e.g. those of custom properties

### Stylistic issues

Provide rules to enforce a diverse range of stylistic conventions, including:

- whitespace
- case
- quotes

## Extensible

Provide multiple points of extensions, including:

- [plugins](../developer-guide/plugins.md) - build community rules to support methodologies, toolsets, non-standard CSS features, or very specific use cases
- [extendable configs](../user-guide/configure.md#extends) - extend and share configurations
- [formatters](../developer-guide/formatters.md) - format stylelint result objects
- [custom syntax](syntaxes.md) - use any PostCSS-compatible syntax module

## Robust

Provide a robust tool with a [comprehensive test suite](../developer-guide/rules.md#write-tests), including:

- high coverage, currently over 95%
- a wide range of fixtures for rules

## Consistent

Provide consistency throughout, including consistent [rules](../user-guide/rules/about.md).

## Performant

Provide a fast tool and the means to test and improve performance, including [benchmarking](../developer-guide/rules.md#improve-the-performance-of-a-rule) of an individual rule's performance.
