# Working on rules

Please help us create, enhance, and debug our rules!

## Add a rule

You should:

1. Get yourself ready to [contribute code](../../CONTRIBUTING.md#code-contributions).
2. Familiarize yourself with the [conventions and patterns](../user-guide/rules/about.md) for rules.

### Write the rule

When writing the rule, you should:

- make the rule strict by default
- add secondary `ignore` options to make the rule more permissive
- not include code specific to language extensions, e.g. SCSS

You should make use of the:

- PostCSS API
- construct-specific parsers
- utility functions

#### PostCSS API

Use the [PostCSS API](https://api.postcss.org/) to navigate and analyze the CSS syntax tree. We recommend using the `walk` iterators (e.g. `walkDecls`), rather than using `forEach` to loop through the nodes.

When using array methods on nodes, e.g. `find`, `some`, `filter` etc, you should explicitly check the `type` property of the node before attempting to access other properties. For example:

```js
const hasProperty = nodes.find(
  ({ type, prop }) => type === "decl" && prop === propertyName
);
```

Use `node.raws` instead of `node.raw()` when accessing raw strings from the [PostCSS AST](https://astexplorer.net/#/gist/ef718daf3e03f1d200b03dc5a550ec60/c8cbe9c6809a85894cebf3fb66de46215c377f1a).

#### Construct-specific parsers

Depending on the rule, we also recommend using:

- [postcss-value-parser](https://github.com/TrySound/postcss-value-parser)
- [postcss-selector-parser](https://github.com/postcss/postcss-selector-parser)

There are significant benefits to using these parsers instead of regular expressions or `indexOf` searches (even if they aren't always the most performant method).

#### Utility functions

stylelint has [utility functions](https://github.com/stylelint/stylelint/tree/master/lib/utils) that are used in existing rules and might prove useful to you, as well. Please look through those so that you know what's available. (And if you have a new function that you think might prove generally helpful, let's add it to the list!).

Use the:

- `validateOptions()` utility to warn users about invalid options
- `isStandardSyntax*` utilities to ignore non-standard syntax

### Add options

Only add an option to a rule if it addresses a _requested_ use case to avoid polluting the tool with unused features.

If your rule can accept an array as its primary option, you must designate this by setting the property `primaryOptionArray = true` on your rule function. For example:

```js
function rule(primary, secondary) {
  return (root, result) => {
    /* .. */
  };
}

rule.primaryOptionArray = true;

module.exports = rule;
```

There is one caveat here: If your rule accepts a primary option array, it cannot also accept a primary option object. Whenever possible, if you want your rule to accept a primary option array, you should make an array the only possibility, instead of allowing for various data structures.

### Add autofix

Depending on the rule, it might be possible to automatically fix the rule's violations by mutating the PostCSS AST (Abstract Syntax Tree) using the [PostCSS API](http://api.postcss.org/).

Add `context` variable to rule parameters:

```js
function rule(primary, secondary, context) {
  return (root, result) => {
    /* .. */
  };
}
```

`context` is an object which could have two properties:

- `fix`(boolean): If `true`, your rule can apply autofixes.
- `newline`(string): Line-ending used in current linted file.

If `context.fix` is `true`, then change `root` using PostCSS API and return early before `report()` is called.

```js
if (context.fix) {
  // Apply fixes using PostCSS API
  return; // Return and don't report a problem
}

report(/* .. */);
```

### Write tests

Each rule must have tests that cover all patterns that:

- are considered violations
- should _not_ be considered violations

Write as many as you can stand to.

You should:

- test errors in multiple positions, not the same place every time
- use realistic (if simple) CSS, and avoid the use of ellipses
- use standard CSS syntax by default, and only swap parsers when testing a specific piece of non-standard syntax

#### Commonly overlooked edge-cases

You should ask yourself how does your rule handle:

- variables (`$sass`, `@less` or `var(--custom-property)`)?
- CSS strings (e.g. `content: "anything goes";`)?
- CSS comments (e.g. `/* anything goes */`)?
- `url()` functions, including data URIs (e.g. `url(anything/goes.jpg)`)?
- vendor prefixes (e.g. `@-webkit-keyframes name {}`)?
- case sensitivity (e.g. `@KEYFRAMES name {}`)?
- a pseudo-class _combined_ with a pseudo-element (e.g. `a:hover::before`)?
- nesting (e.g. do you resolve `& a {}`, or check it as is?)?
- whitespace and punctuation (e.g. comparing `rgb(0,0,0)` with `rgb(0, 0, 0)`)?

### Write the README

You should:

- only use standard CSS syntax in example code and options
- use `<!-- prettier-ignore -->` before `css` code fences
- use "this rule" to refer to the rule, e.g. "This rule ignores ..."
- align the arrows within the prototypical code example with the beginning of the highlighted construct
- align the text within the prototypical code example as far to the left as possible

For example:

<!-- prettier-ignore -->
```css
 @media screen and (min-width: 768px) {}
/**                 ↑          ↑
  *       These names and values */
```

When writing examples, you should use:

- complete CSS patterns i.e. avoid ellipses (`...`)
- the minimum amount of code possible to communicate the pattern, e.g. if the rule targets selectors then use an empty rule, e.g. `{}`
- `{}`, rather than `{ }` for empty rules
- the `a` type selector by default
- the `@media` at-rules by default
- the `color` property by default
- _foo_, _bar_ and _baz_ for names, e.g. `.foo`, `#bar`, `--baz`

Look at the READMEs of other rules to glean more conventional patterns.

### Wire up the rule

The final step is to add references to the new rule in the following places:

- [The rules `index.js` file](../../lib/rules/index.js)
- [The list of rules](../user-guide/rules/list.md)

## Add an option to a rule

You should:

1. Get ready to [contribute code](../../CONTRIBUTING.md#code-contributions).
2. Change the rule's validation to allow for the new option.
3. Add new unit tests to test the option.
4. Add (as little as possible) logic to the rule to make the tests pass.
5. Add documentation about the new option.

## Fix a bug in a rule

You should:

1. Get ready to [contribute code](../../CONTRIBUTING.md#code-contributions).
2. Write failing unit tests that exemplify the bug.
3. Fiddle with the rule until those new tests pass.

## Deprecate a rule

Deprecating rules doesn't happen very often. When you do, you must:

1. Point the `stylelintReference` link to the specific version of the rule README on the GitHub website, so that it is always accessible.
2. Add the appropriate meta data to mark the rule as deprecated.

## Improve the performance of a rule

You can run a benchmarks on any given rule with any valid config using:

```shell
npm run benchmark-rule -- ruleName ruleOptions [ruleContext]
```

If the `ruleOptions` argument is anything other than a string or a boolean, it must be valid JSON wrapped in quotation marks.

```shell
npm run benchmark-rule -- selector-combinator-space-after never
```

```shell
npm run benchmark-rule -- selector-combinator-space-after always
```

```shell
npm run benchmark-rule -- block-opening-brace-space-before "[\"always\", {\"ignoreAtRules\": [\"else\"]}]"
```

If the `ruleContext` argument is specified, the sames procedure would apply:

```shell
npm run benchmark-rule -- block-opening-brace-space-before "[\"always\", {\"ignoreAtRules\": [\"else\"]}]" "{\"fix\": \"true\"}"
```

The script loads Bootstrap's CSS (from its CDN) and runs it through the configured rule.

It will end up printing some simple stats like this:

```shell
Warnings: 1441
Mean: 74.17598357142856 ms
Deviation: 16.63969674310928 ms
```

When writing new rules or refactoring existing rules, use these measurements to determine the efficiency of your code.

A stylelint rule can repeat its core logic many, many times (e.g. checking every value node of every declaration in a vast CSS codebase). So it's worth paying attention to performance and doing what we can to improve it!

**Improving the performance of a rule is a great way to contribute if you want a quick little project.** Try picking a rule and seeing if there's anything you can do to speed it up.

Make sure you include benchmark measurements in your pull request!
