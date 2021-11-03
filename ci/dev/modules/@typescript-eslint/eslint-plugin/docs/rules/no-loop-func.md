# Disallow function declarations that contain unsafe references inside loop statements (`no-loop-func`)

## Rule Details

This rule extends the base [`eslint/no-loop-func`](https://eslint.org/docs/rules/no-loop-func) rule.
It adds support for TypeScript types.

## How to use

```jsonc
{
  // note you must disable the base rule as it can report incorrect errors
  "no-loop-func": "off",
  "@typescript-eslint/no-loop-func": ["error"]
}
```

## Options

See [`eslint/no-loop-func` options](https://eslint.org/docs/rules/no-loop-func#options).

<sup>Taken with ❤️ [from ESLint core](https://github.com/eslint/eslint/blob/master/docs/rules/no-loop-func.md)</sup>
