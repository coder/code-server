# Disallow empty functions (`no-empty-function`)

## Rule Details

This rule extends the base [`eslint/no-empty-function`](https://eslint.org/docs/rules/no-empty-function) rule.
It adds support for handling TypeScript specific code that would otherwise trigger the rule.

One example of valid TypeScript specific code that would otherwise trigger the `no-empty-function` rule is the use of [parameter properties](https://www.typescriptlang.org/docs/handbook/classes.html#parameter-properties) in constructor functions.

## How to use

```jsonc
{
  // note you must disable the base rule as it can report incorrect errors
  "no-empty-function": "off",
  "@typescript-eslint/no-empty-function": ["error"]
}
```

## Options

See [`eslint/no-empty-function` options](https://eslint.org/docs/rules/no-empty-function#options).
This rule adds the following options:

```ts
type AdditionalAllowOptionEntries =
  | 'private-constructors'
  | 'protected-constructors'
  | 'decoratedFunctions';

type AllowOptionEntries =
  | BaseNoEmptyFunctionAllowOptionEntries
  | AdditionalAllowOptionEntries;

interface Options extends BaseNoEmptyFunctionOptions {
  allow?: Array<AllowOptionEntries>;
}
const defaultOptions: Options = {
  ...baseNoEmptyFunctionDefaultOptions,
  allow: [],
};
```

### allow: `private-constructors`

Examples of correct code for the `{ "allow": ["private-constructors"] }` option:

```ts
class Foo {
  private constructor() {}
}
```

### allow: `protected-constructors`

Examples of correct code for the `{ "allow": ["protected-constructors"] }` option:

```ts
class Foo {
  protected constructor() {}
}
```

### allow: `decoratedFunctions`

Examples of correct code for the `{ "allow": ["decoratedFunctions"] }` option:

```ts
@decorator()
function foo() {}

class Foo {
  @decorator()
  foo() {}
}
```

## How to use

```jsonc
{
  // note you must disable the base rule as it can report incorrect errors
  "no-empty-function": "off",
  "@typescript-eslint/no-empty-function": ["error"]
}
```

---

<sup>Taken with ❤️ [from ESLint core](https://github.com/eslint/eslint/blob/master/docs/rules/no-empty-function.md)</sup>
