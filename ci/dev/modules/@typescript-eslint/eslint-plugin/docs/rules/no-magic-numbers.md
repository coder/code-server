# Disallow magic numbers (`no-magic-numbers`)

## Rule Details

This rule extends the base [`eslint/no-magic-numbers`](https://eslint.org/docs/rules/no-magic-numbers) rule.
It adds support for:

- numeric literal types (`type T = 1`),
- `enum` members (`enum Foo { bar = 1 }`),
- `readonly` class properties (`class Foo { readonly bar = 1 }`).

## How to use

```jsonc
{
  // note you must disable the base rule as it can report incorrect errors
  "no-magic-numbers": "off",
  "@typescript-eslint/no-magic-numbers": [
    "error",
    {
      /* options */
    }
  ]
}
```

## Options

See [`eslint/no-magic-numbers` options](https://eslint.org/docs/rules/no-magic-numbers#options).
This rule adds the following options:

```ts
interface Options extends BaseNoMagicNumbersOptions {
  ignoreEnums?: boolean;
  ignoreNumericLiteralTypes?: boolean;
  ignoreReadonlyClassProperties?: boolean;
}

const defaultOptions: Options = {
  ...baseNoMagicNumbersDefaultOptions,
  ignoreEnums: false,
  ignoreNumericLiteralTypes: false,
  ignoreReadonlyClassProperties: false,
};
```

### `ignoreEnums`

A boolean to specify if enums used in TypeScript are considered okay. `false` by default.

Examples of **incorrect** code for the `{ "ignoreEnums": false }` option:

```ts
/*eslint @typescript-eslint/no-magic-numbers: ["error", { "ignoreEnums": false }]*/

enum foo {
  SECOND = 1000,
}
```

Examples of **correct** code for the `{ "ignoreEnums": true }` option:

```ts
/*eslint @typescript-eslint/no-magic-numbers: ["error", { "ignoreEnums": true }]*/

enum foo {
  SECOND = 1000,
}
```

### `ignoreNumericLiteralTypes`

A boolean to specify if numbers used in TypeScript numeric literal types are considered okay. `false` by default.

Examples of **incorrect** code for the `{ "ignoreNumericLiteralTypes": false }` option:

```ts
/*eslint @typescript-eslint/no-magic-numbers: ["error", { "ignoreNumericLiteralTypes": false }]*/

type SmallPrimes = 2 | 3 | 5 | 7 | 11;
```

Examples of **correct** code for the `{ "ignoreNumericLiteralTypes": true }` option:

```ts
/*eslint @typescript-eslint/no-magic-numbers: ["error", { "ignoreNumericLiteralTypes": true }]*/

type SmallPrimes = 2 | 3 | 5 | 7 | 11;
```

### `ignoreReadonlyClassProperties`

Examples of **incorrect** code for the `{ "ignoreReadonlyClassProperties": false }` option:

```ts
/*eslint @typescript-eslint/no-magic-numbers: ["error", { "ignoreReadonlyClassProperties": false }]*/

class Foo {
  readonly A = 1;
  readonly B = 2;
  public static readonly C = 1;
  static readonly D = 1;
}
```

Examples of **correct** code for the `{ "ignoreReadonlyClassProperties": true }` option:

```ts
/*eslint @typescript-eslint/no-magic-numbers: ["error", { "ignoreReadonlyClassProperties": true }]*/

class Foo {
  readonly A = 1;
  readonly B = 2;
  public static readonly C = 1;
  static readonly D = 1;
}
```

<sup>Taken with ❤️ [from ESLint core](https://github.com/eslint/eslint/blob/master/docs/rules/no-magic-numbers.md)</sup>
