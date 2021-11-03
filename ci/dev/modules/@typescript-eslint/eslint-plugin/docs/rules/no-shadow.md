# Disallow variable declarations from shadowing variables declared in the outer scope (`no-shadow`)

## Rule Details

This rule extends the base [`eslint/no-shadow`](https://eslint.org/docs/rules/no-shadow) rule.
It adds support for TypeScript's `this` parameters and global augmentation, and adds options for TypeScript features.

## How to use

```jsonc
{
  // note you must disable the base rule as it can report incorrect errors
  "no-shadow": "off",
  "@typescript-eslint/no-shadow": ["error"]
}
```

## Options

See [`eslint/no-shadow` options](https://eslint.org/docs/rules/no-shadow#options).
This rule adds the following options:

```ts
interface Options extends BaseNoShadowOptions {
  ignoreTypeValueShadow?: boolean;
  ignoreFunctionTypeParameterNameValueShadow?: boolean;
}

const defaultOptions: Options = {
  ...baseNoShadowDefaultOptions,
  ignoreTypeValueShadow: true,
  ignoreFunctionTypeParameterNameValueShadow: true,
};
```

### `ignoreTypeValueShadow`

When set to `true`, the rule will ignore the case when you name a type the same as a variable.

TypeScript allows types and variables to shadow one-another. This is generally safe because you cannot use variables in type locations without a `typeof` operator, so there's little risk of confusion.

Examples of **correct** code with `{ ignoreTypeValueShadow: true }`:

```ts
type Foo = number;
const Foo = 1;

interface Bar {
  prop: number;
}
const Bar = 'test';
```

### `ignoreFunctionTypeParameterNameValueShadow`

When set to `true`, the rule will ignore the case when you name a function type argument the same as a variable.

Each of a function type's arguments creates a value variable within the scope of the function type. This is done so that you can reference the type later using the `typeof` operator:

```ts
type Func = (test: string) => typeof test;

declare const fn: Func;
const result = fn('str'); // typeof result === string
```

This means that function type arguments shadow value variable names in parent scopes:

```ts
let test = 1;
type TestType = typeof test; // === number
type Func = (test: string) => typeof test; // this "test" references the argument, not the variable

declare const fn: Func;
const result = fn('str'); // typeof result === string
```

If you do not use the `typeof` operator in a function type return type position, you can safely turn this option on.

Examples of **correct** code with `{ ignoreFunctionTypeParameterNameValueShadow: true }`:

```ts
const test = 1;
type Func = (test: string) => typeof test;
```

<sup>Taken with ❤️ [from ESLint core](https://github.com/eslint/eslint/blob/master/docs/rules/no-shadow.md)</sup>
