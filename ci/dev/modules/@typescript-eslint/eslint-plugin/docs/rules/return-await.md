# Enforces consistent returning of awaited values (`return-await`)

Returning an awaited promise can make sense for better stack trace information as well as for consistent error handling (returned promises will not be caught in an async function try/catch).

## Rule Details

This rule builds on top of the [`eslint/no-return-await`](https://eslint.org/docs/rules/no-return-await) rule.
It expands upon the base rule to add support for optionally requiring `return await` in certain cases.

## How to use

```jsonc
{
  // note you must disable the base rule as it can report incorrect errors
  "no-return-await": "off",
  "@typescript-eslint/return-await": "error"
}
```

## Options

```ts
type Options = 'in-try-catch' | 'always' | 'never';

const defaultOptions: Options = 'in-try-catch';
```

### `in-try-catch`

Requires that a returned promise must be `await`ed in `try-catch-finally` blocks, and disallows it elsewhere.
Specifically:

- if you `return` a promise within a `try`, then it must be `await`ed.
- if you `return` a promise within a `catch`, and there **_is no_** `finally`, then it **_must not_** be `await`ed.
- if you `return` a promise within a `catch`, and there **_is a_** `finally`, then it **_must_** be `await`ed.
- if you `return` a promise within a `finally`, then it **_must not_** be `await`ed.

Examples of **incorrect** code with `in-try-catch`:

```ts
async function invalidInTryCatch1() {
  try {
    return Promise.resolve('try');
  } catch (e) {}
}

async function invalidInTryCatch2() {
  try {
    throw new Error('error');
  } catch (e) {
    return await Promise.resolve('catch');
  }
}

async function invalidInTryCatch3() {
  try {
    throw new Error('error');
  } catch (e) {
    return Promise.resolve('catch');
  } finally {
    console.log('cleanup');
  }
}

async function invalidInTryCatch4() {
  try {
    throw new Error('error');
  } catch (e) {
    throw new Error('error2');
  } finally {
    return await Promise.resolve('finally');
  }
}

async function invalidInTryCatch5() {
  return await Promise.resolve('try');
}

async function invalidInTryCatch6() {
  return await 'value';
}
```

Examples of **correct** code with `in-try-catch`:

```ts
async function validInTryCatch1() {
  try {
    return await Promise.resolve('try');
  } catch (e) {}
}

async function validInTryCatch2() {
  try {
    throw new Error('error');
  } catch (e) {
    return Promise.resolve('catch');
  }
}

async function validInTryCatch3() {
  try {
    throw new Error('error');
  } catch (e) {
    return await Promise.resolve('catch');
  } finally {
    console.log('cleanup');
  }
}

async function validInTryCatch4() {
  try {
    throw new Error('error');
  } catch (e) {
    throw new Error('error2');
  } finally {
    return Promise.resolve('finally');
  }
}

async function validInTryCatch5() {
  return Promise.resolve('try');
}

async function validInTryCatch6() {
  return 'value';
}
```

### `always`

Requires that all returned promises are `await`ed.

Examples of **incorrect** code with `always`:

```ts
async function invalidAlways1() {
  try {
    return Promise.resolve('try');
  } catch (e) {}
}

async function invalidAlways2() {
  return Promise.resolve('try');
}

async function invalidAlways3() {
  return await 'value';
}
```

Examples of **correct** code with `always`:

```ts
async function validAlways1() {
  try {
    return await Promise.resolve('try');
  } catch (e) {}
}

async function validAlways2() {
  return await Promise.resolve('try');
}

async function validAlways3() {
  return 'value';
}
```

### `never`

Disallows all `await`ing any returned promises.

Examples of **incorrect** code with `never`:

```ts
async function invalidNever1() {
  try {
    return await Promise.resolve('try');
  } catch (e) {}
}

async function invalidNever2() {
  return await Promise.resolve('try');
}

async function invalidNever3() {
  return await 'value';
}
```

Examples of **correct** code with `never`:

```ts
async function validNever1() {
  try {
    return Promise.resolve('try');
  } catch (e) {}
}

async function validNever2() {
  return Promise.resolve('try');
}

async function validNever3() {
  return 'value';
}
```
