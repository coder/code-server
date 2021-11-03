# Enforce the consistent use of either backticks, double, or single quotes (`quotes`)

## Rule Details

This rule extends the base [`eslint/quotes`](https://eslint.org/docs/rules/quotes) rule.
It adds support for TypeScript features which allow quoted names, but not backtick quoted names.

## How to use

```jsonc
{
  // note you must disable the base rule as it can report incorrect errors
  "quotes": "off",
  "@typescript-eslint/quotes": ["error"]
}
```

## Options

See [`eslint/quotes` options](https://eslint.org/docs/rules/quotes#options).

<sup>Taken with ❤️ [from ESLint core](https://github.com/eslint/eslint/blob/master/docs/rules/quotes.md)</sup>
