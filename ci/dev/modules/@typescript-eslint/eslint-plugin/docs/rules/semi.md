# Require or disallow semicolons instead of ASI (`semi`)

This rule enforces consistent use of semicolons after statements.

## Rule Details

This rule extends the base [`eslint/semi`](https://eslint.org/docs/rules/semi) rule.
It adds support for TypeScript features that require semicolons.

See also the [`@typescript-eslint/member-delimiter-style`](member-delimiter-style.md) rule, which allows you to specify the delimiter for `type` and `interface` members.

## How to use

```jsonc
{
  // note you must disable the base rule as it can report incorrect errors
  "semi": "off",
  "@typescript-eslint/semi": ["error"]
}
```

## Options

See [`eslint/semi` options](https://eslint.org/docs/rules/semi#options).

<sup>Taken with ❤️ [from ESLint core](https://github.com/eslint/eslint/blob/master/docs/rules/semi.md)</sup>
