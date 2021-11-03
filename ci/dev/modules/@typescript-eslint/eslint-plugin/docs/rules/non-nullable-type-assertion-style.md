# Prefers a non-null assertion over explicit type cast when possible (`non-nullable-type-assertion-style`)

This rule detects when an `as` cast is doing the same job as a `!` would, and suggests fixing the code to be an `!`.

## Rule Details

Examples of **incorrect** code for this rule:

```ts
const maybe = Math.random() > 0.5 ? '' : undefined;

const definitely = maybe as string;
const alsoDefinitely = <string>maybe;
```

Examples of **correct** code for this rule:

```ts
const maybe = Math.random() > 0.5 ? '' : undefined;

const definitely = maybe!;
const alsoDefinitely = maybe!;
```

## When Not To Use It

If you don't mind having unnecessarily verbose type casts, you can avoid this rule.
