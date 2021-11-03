# Recommends using `@ts-expect-error` over `@ts-ignore` (`prefer-ts-expect-error`)

TypeScript allows you to suppress all errors on a line by placing a single-line comment or a comment block line starting with `@ts-ignore` immediately before the erroring line.
While powerful, there is no way to know if a `@ts-ignore` is actually suppressing an error without manually investigating what happens when the `@ts-ignore` is removed.

This means its easy for `@ts-ignore`s to be forgotten about, and remain in code even after the error they were suppressing is fixed.
This is dangerous, as if a new error arises on that line it'll be suppressed by the forgotten about `@ts-ignore`, and so be missed.

To address this, TS3.9 ships with a new single-line comment directive: `// @ts-expect-error`.

This directive operates in the same manner as `@ts-ignore`, but will error if the line it's meant to be suppressing doesn't actually contain an error, making it a lot safer.

## Rule Details

This rule looks for usages of `@ts-ignore`, and flags them to be replaced with `@ts-expect-error`.

Examples of **incorrect** code for this rule:

```ts
// @ts-ignore
const str: string = 1;

/**
 * Explaining comment
 *
 * @ts-ignore */
const multiLine: number = 'value';

/** @ts-ignore */
const block: string = 1;

const isOptionEnabled = (key: string): boolean => {
  // @ts-ignore: if key isn't in globalOptions it'll be undefined which is false
  return !!globalOptions[key];
};
```

Examples of **correct** code for this rule:

```ts
// @ts-expect-error
const str: string = 1;

/**
 * Explaining comment
 *
 * @ts-expect-error */
const multiLine: number = 'value';

/** @ts-expect-error */
const block: string = 1;

const isOptionEnabled = (key: string): boolean => {
  // @ts-expect-error: if key isn't in globalOptions it'll be undefined which is false
  return !!globalOptions[key];
};
```

## When Not To Use It

If you are **NOT** using TypeScript 3.9 (or greater), then you will not be able to use this rule, as the directive is not supported

## Further Reading

- [Original Implementing PR](https://github.com/microsoft/TypeScript/pull/36014)
