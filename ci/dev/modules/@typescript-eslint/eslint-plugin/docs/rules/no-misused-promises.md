# Avoid using promises in places not designed to handle them (`no-misused-promises`)

This rule forbids using promises in places where the TypeScript compiler
allows them but they are not handled properly. These situations can often arise
due to a missing `await` keyword or just a misunderstanding of the way async
functions are handled/awaited.

## Rule Details

Examples of **incorrect** code for this rule with `checksConditionals: true`:

```ts
const promise = Promise.resolve('value');

if (promise) {
  // Do something
}

const val = promise ? 123 : 456;

while (promise) {
  // Do something
}
```

Examples of **incorrect** code for this rule with `checksVoidReturn: true`:

```ts
[1, 2, 3].forEach(async value => {
  await doSomething(value);
});

new Promise(async (resolve, reject) => {
  await doSomething();
  resolve();
});

const eventEmitter = new EventEmitter();
eventEmitter.on('some-event', async () => {
  await doSomething();
});
```

Examples of **correct** code for this rule:

```ts
const promise = Promise.resolve('value');

if (await promise) {
  // Do something
}

const val = (await promise) ? 123 : 456;

while (await promise) {
  // Do something
}

for (const value of [1, 2, 3]) {
  await doSomething(value);
}

new Promise((resolve, reject) => {
  // Do something
  resolve();
});

const eventEmitter = new EventEmitter();
eventEmitter.on('some-event', () => {
  doSomething();
});
```

## Options

This rule accepts a single option which is an object with `checksConditionals`
and `checksVoidReturn` properties indicating which types of misuse to flag.
Both are enabled by default

If you don't want functions that return promises where a void return is
expected to be checked, your configuration will look like this:

```json
{
  "@typescript-eslint/no-misused-promises": [
    "error",
    {
      "checksVoidReturn": false
    }
  ]
}
```

Likewise, if you don't want to check conditionals, you can configure the rule
like this:

```json
{
  "@typescript-eslint/no-misused-promises": [
    "error",
    {
      "checksConditionals": false
    }
  ]
}
```

## When Not To Use It

If you do not use Promises in your codebase or are not concerned with possible
misuses of them outside of what the TypeScript compiler will check.

## Related to

- [`no-floating-promises`](./no-floating-promises.md)

## Further Reading

- [TypeScript void function assignability](https://github.com/Microsoft/TypeScript/wiki/FAQ#why-are-functions-returning-non-void-assignable-to-function-returning-void)
