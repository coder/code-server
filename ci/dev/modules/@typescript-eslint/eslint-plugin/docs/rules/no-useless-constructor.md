# Disallow unnecessary constructors (`no-useless-constructor`)

## Rule Details

This rule extends the base [`eslint/no-useless-constructor`](https://eslint.org/docs/rules/no-useless-constructor) rule.
It adds support for:

- constructors marked as `protected` / `private` (i.e. marking a constructor as non-public),
- `public` constructors when there is no superclass,
- constructors with only parameter properties.

## How to use

```jsonc
{
  // note you must disable the base rule as it can report incorrect errors
  "no-useless-constructor": "off",
  "@typescript-eslint/no-useless-constructor": ["error"]
}
```

## Options

See [`eslint/no-useless-constructor` options](https://eslint.org/docs/rules/no-useless-constructor#options).

<sup>Taken with ❤️ [from ESLint core](https://github.com/eslint/eslint/blob/master/docs/rules/no-useless-constructor.md)</sup>
