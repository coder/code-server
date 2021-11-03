# Requires Promise-like values to be handled appropriately (`no-floating-promises`)

This rule forbids usage of Promise-like values in statements without handling
their errors appropriately. Unhandled promises can cause several issues, such
as improperly sequenced operations, ignored Promise rejections and more. Valid
ways of handling a Promise-valued statement include `await`ing, returning, and
either calling `.then()` with two arguments or `.catch()` with one argument.

## Rule Details

Examples of **incorrect** code for this rule:

```ts
const promise = new Promise((resolve, reject) => resolve('value'));
promise;

async function returnsPromise() {
  return 'value';
}
returnsPromise().then(() => {});

Promise.reject('value').catch();

Promise.reject('value').finally();
```

Examples of **correct** code for this rule:

```ts
const promise = new Promise((resolve, reject) => resolve('value'));
await promise;

async function returnsPromise() {
  return 'value';
}
returnsPromise().then(
  () => {},
  () => {},
);

Promise.reject('value').catch(() => {});

Promise.reject('value').finally(() => {});
```

## Options

The rule accepts an options object with the following properties:

```ts
type Options = {
  // if true, checking void expressions will be skipped
  ignoreVoid?: boolean;
  // if true, checking for async iife will be skipped
  ignoreIIFE?: boolean;
};

const defaults = {
  ignoreVoid: true,
  ignoreIIFE: false,
};
```

### `ignoreVoid`

This allows you to stop the rule reporting promises consumed with void operator.
This can be a good way to explicitly mark a promise as intentionally not awaited.

Examples of **correct** code for this rule with `{ ignoreVoid: true }`:

```ts
async function returnsPromise() {
  return 'value';
}
void returnsPromise();

void Promise.reject('value');
```

With this option set to `true`, and if you are using `no-void`, you should turn on the [`allowAsStatement`](https://eslint.org/docs/rules/no-void#allowasstatement) option.

### `ignoreIIFE`

This allows you to skip checking of async iife

Examples of **correct** code for this rule with `{ ignoreIIFE: true }`:

```ts
await(async function () {
  await res(1);
})();

(async function () {
  await res(1);
})();
```

## When Not To Use It

If you do not use Promise-like values in your codebase, or want to allow them to remain unhandled.

## Related to

- TSLint: ['no-floating-promises'](https://palantir.github.io/tslint/rules/no-floating-promises/)
