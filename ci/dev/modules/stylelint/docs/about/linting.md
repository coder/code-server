# Linting

A linter is a tool that analyzes source code to flag programming errors, bugs, stylistic errors, and suspicious constructs.

You can use a linter with a pretty printer and a validator. There are, however, usually overlaps between these three types of tools.

## Pretty printers

There are two approaches to enforcing stylistic conventions:

- a machine algorithmically pretty prints the code (usually based on a maximum line length)
- a human initially formats the code, and a machine fixes-up/warns-about any mistakes

The former is handled by pretty printers, like [prettier](https://github.com/prettier/prettier), whereas the latter is catered for by the built-in [stylistic rules](../user-guide/rules/list.md#stylistic-issues). If you use a pretty printer, you'll want to use [`stylelint-config-recommended`](https://github.com/stylelint/stylelint-config-recommended), which only turns on [possible error](../user-guide/rules/list.md#possible-errors) rules.

Additionally, the built-in stylistic rules and plugins are configurable to support a diverse range of stylistic conventions. For example, ordering properties within declaration blocks is a divisive topic, where there isn't a dominant convention. The [`stylelint-order`](https://www.npmjs.com/package/stylelint-order) plugin can be configured to lint and fix a diverse range of ordering conventions.

Another example is the use of single-line rules for sets of _related_ rules, e.g.

<!-- prettier-ignore -->
```css
/* Single-line related classes */
.class-1 { top: 0; bottom: 0; }
.class-2 { top: 5px; right: 0; }
.class-3 { top: 8px; left: 0; }
```

You can configure the built-in stylistic rules to allow both multi-line and single-line rules. The choice of when to use each belongs to the user.

## Validators

Validators like [csstree](https://github.com/csstree/csstree) identify invalid code such as misformed hex colors and unknown language features.

However, as a stop-gap, while these tools mature stylelint provides rules for the simplest of cases.
