# Enforce consistent spacing before and after keywords (`keyword-spacing`)

## Rule Details

This rule extends the base [`eslint/keyword-spacing`](https://eslint.org/docs/rules/keyword-spacing) rule.
This version adds support for generic type parameters on function calls.

## How to use

```jsonc
{
  // note you must disable the base rule as it can report incorrect errors
  "keyword-spacing": "off",
  "@typescript-eslint/keyword-spacing": ["error"]
}
```

## Options

See [`eslint/keyword-spacing` options](https://eslint.org/docs/rules/keyword-spacing#options).

<sup>Taken with ❤️ [from ESLint core](https://github.com/eslint/eslint/blob/master/docs/rules/keyword-spacing.md)</sup>
