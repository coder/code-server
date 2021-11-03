# Disallow throwing literals as exceptions (`no-throw-literal`)

It is considered good practice to only `throw` the `Error` object itself or an object using the `Error` object as base objects for user-defined exceptions.
The fundamental benefit of `Error` objects is that they automatically keep track of where they were built and originated.

This rule restricts what can be thrown as an exception. When it was first created, it only prevented literals from being thrown (hence the name), but it has now been expanded to only allow expressions which have a possibility of being an `Error` object.

## Rule Details

This rule is aimed at maintaining consistency when throwing exception by disallowing to throw literals and other expressions which cannot possibly be an `Error` object.

Examples of **incorrect** code for this rule:

```ts
/*eslint @typescript-eslint/no-throw-literal: "error"*/

throw 'error';

throw 0;

throw undefined;

throw null;

const err = new Error();
throw 'an ' + err;

const err = new Error();
throw `${err}`;

const err = '';
throw err;

function err() {
  return '';
}
throw err();

const foo = {
  bar: '',
};
throw foo.bar;
```

Examples of **correct** code for this rule:

```ts
/*eslint @typescript-eslint/no-throw-literal: "error"*/

throw new Error();

throw new Error("error");

const e = new Error("error");
throw e;

try {
    throw new Error("error");
} catch (e) {
    throw e;
}

const err = new Error();
throw err;

function err() {
  return new Error();
}
throw err();

const foo = {
  bar: new Error();
}
throw foo.bar;

class CustomError extends Error {
  // ...
};
throw new CustomError();
```

## How to use

```jsonc
{
  // note you must disable the base rule as it can report incorrect errors
  "no-throw-literal": "off",
  "@typescript-eslint/no-throw-literal": ["error"]
}
```

---

<sup>Taken with ❤️ [from ESLint core](https://github.com/eslint/eslint/blob/master/docs/rules/no-throw-literal.md)</sup>
