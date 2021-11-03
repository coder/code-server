# Enforce consistent indentation (`indent`)

## PLEASE READ THIS ISSUE BEFORE USING THIS RULE [#1824](https://github.com/typescript-eslint/typescript-eslint/issues/1824)

## Rule Details

This rule extends the base [`eslint/indent`](https://eslint.org/docs/rules/indent) rule.
It adds support for TypeScript nodes.

## How to use

```jsonc
{
  // note you must disable the base rule as it can report incorrect errors
  "indent": "off",
  "@typescript-eslint/indent": ["error"]
}
```

## Options

See [`eslint/indent` options](https://eslint.org/docs/rules/indent#options).

<sup>Taken with ❤️ [from ESLint core](https://github.com/eslint/eslint/blob/master/docs/rules/indent.md)</sup>
