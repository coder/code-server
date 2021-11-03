# Bans `// tslint:<rule-flag>` comments from being used (`ban-tslint-comment`)

Useful when migrating from TSLint to ESLint. Once TSLint has been removed, this rule helps locate TSLint annotations (e.g. `// tslint:disable`).

## Rule Details

Examples of **incorrect** code for this rule:

All TSLint [rule flags](https://palantir.github.io/tslint/usage/rule-flags/)

```js
/* tslint:disable */
/* tslint:enable */
/* tslint:disable:rule1 rule2 rule3... */
/* tslint:enable:rule1 rule2 rule3... */
// tslint:disable-next-line
someCode(); // tslint:disable-line
// tslint:disable-next-line:rule1 rule2 rule3...
```

Examples of **correct** code for this rule:

```js
// This is a comment that just happens to mention tslint
```

## When Not To Use It

If you are still using TSLint.
