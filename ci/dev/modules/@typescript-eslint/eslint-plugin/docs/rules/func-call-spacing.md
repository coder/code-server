# Require or disallow spacing between function identifiers and their invocations (`func-call-spacing`)

## Rule Details

This rule extends the base [`eslint/func-call-spacing`](https://eslint.org/docs/rules/func-call-spacing) rule.
It adds support for generic type parameters on function calls.

## How to use

```jsonc
{
  // note you must disable the base rule as it can report incorrect errors
  "func-call-spacing": "off",
  "@typescript-eslint/func-call-spacing": ["error"]
}
```

## Options

See [`eslint/func-call-spacing` options](https://eslint.org/docs/rules/func-call-spacing#options).

<sup>Taken with ❤️ [from ESLint core](https://github.com/eslint/eslint/blob/master/docs/rules/func-call-spacing.md)</sup>
