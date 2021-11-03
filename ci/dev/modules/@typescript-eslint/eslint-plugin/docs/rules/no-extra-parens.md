# Disallow unnecessary parentheses (`no-extra-parens`)

## Rule Details

This rule extends the base [`eslint/no-extra-parens`](https://eslint.org/docs/rules/no-extra-parens) rule.
It adds support for TypeScript type assertions.

## How to use

```jsonc
{
  // note you must disable the base rule as it can report incorrect errors
  "no-extra-parens": "off",
  "@typescript-eslint/no-extra-parens": ["error"]
}
```

## Options

See [`eslint/no-extra-parens` options](https://eslint.org/docs/rules/no-extra-parens#options).

<sup>Taken with ❤️ [from ESLint core](https://github.com/eslint/eslint/blob/master/docs/rules/no-extra-parens.md)</sup>
