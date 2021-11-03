# Enforce that `RegExp#exec` is used instead of `String#match` if no global flag is provided (`prefer-regexp-exec`)

As `String#match` is defined to be the same as `RegExp#exec` when the regular expression does not include the `g` flag, prefer a consistent usage.

## Rule Details

This rule is aimed at enforcing a consistent way to apply regular expressions to strings.

From [`String#match` on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match):

> If the regular expression does not include the g flag, returns the same result as `RegExp.exec()`.

`RegExp#exec` may also be slightly faster than `String#match`; this is the reason to choose it as the preferred usage.

Examples of **incorrect** code for this rule:

```ts
'something'.match(/thing/);

'some things are just things'.match(/thing/);

const text = 'something';
const search = /thing/;
text.match(search);
```

Examples of **correct** code for this rule:

```ts
/thing/.exec('something');

'some things are just things'.match(/thing/g);

const text = 'something';
const search = /thing/;
search.exec(text);
```

## Options

There are no options.

```json
{
  "@typescript-eslint/prefer-regexp-exec": "error"
}
```

## When Not To Use It

If you prefer consistent use of `String#match` for both, with `g` flag and without it, you can turn this rule off.
