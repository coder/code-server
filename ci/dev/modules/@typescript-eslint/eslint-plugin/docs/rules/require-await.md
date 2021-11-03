# Disallow async functions which have no `await` expression (`require-await`)

## Rule Details

This rule extends the base [`eslint/require-await`](https://eslint.org/docs/rules/require-await) rule.
It uses type information to add support for `async` functions that return a `Promise`.

Examples of **correct** code for this rule:

```ts
async function returnsPromise1() {
  return Promise.resolve(1);
}

const returnsPromise2 = () => returnsPromise1();
```

## How to use

```jsonc
{
  // note you must disable the base rule as it can report incorrect errors
  "require-await": "off",
  "@typescript-eslint/require-await": "error"
}
```

## Options

See [`eslint/require-await` options](https://eslint.org/docs/rules/require-await#options).

<sup>Taken with ❤️ [from ESLint core](https://github.com/eslint/eslint/blob/master/docs/rules/require-await.md)</sup>
