# Disallow usage of the `any` type (`no-explicit-any`)

Using the `any` type defeats the purpose of using TypeScript.
When `any` is used, all compiler type checks around that value are ignored.

## Rule Details

This rule doesn't allow `any` types to be defined.
It aims to keep TypeScript maximally useful.
TypeScript has a compiler flag for `--noImplicitAny` that will prevent
an `any` type from being implied by the compiler, but doesn't prevent
`any` from being explicitly used.

The following patterns are considered warnings:

```ts
const age: any = 'seventeen';
```

```ts
const ages: any[] = ['seventeen'];
```

```ts
const ages: Array<any> = ['seventeen'];
```

```ts
function greet(): any {}
```

```ts
function greet(): any[] {}
```

```ts
function greet(): Array<any> {}
```

```ts
function greet(): Array<Array<any>> {}
```

```ts
function greet(param: Array<any>): string {}
```

```ts
function greet(param: Array<any>): Array<any> {}
```

The following patterns are not warnings:

```ts
const age: number = 17;
```

```ts
const ages: number[] = [17];
```

```ts
const ages: Array<number> = [17];
```

```ts
function greet(): string {}
```

```ts
function greet(): string[] {}
```

```ts
function greet(): Array<string> {}
```

```ts
function greet(): Array<Array<string>> {}
```

```ts
function greet(param: Array<string>): string {}
```

```ts
function greet(param: Array<string>): Array<string> {}
```

## Options

The rule accepts an options object with the following properties:

```ts
type Options = {
  // if true, auto-fixing will be made available in which the "any" type is converted to an "unknown" type
  fixToUnknown: boolean;
  // specify if arrays from the rest operator are considered okay
  ignoreRestArgs: boolean;
};

const defaults = {
  fixToUnknown: false,
  ignoreRestArgs: false,
};
```

### `ignoreRestArgs`

A boolean to specify if arrays from the rest operator are considered okay. `false` by default.

Examples of **incorrect** code for the `{ "ignoreRestArgs": false }` option:

```ts
/*eslint @typescript-eslint/no-explicit-any: ["error", { "ignoreRestArgs": false }]*/

function foo1(...args: any[]): void {}
function foo2(...args: readonly any[]): void {}
function foo3(...args: Array<any>): void {}
function foo4(...args: ReadonlyArray<any>): void {}

declare function bar(...args: any[]): void;

const baz = (...args: any[]) => {};
const qux = function (...args: any[]) {};

type Quux = (...args: any[]) => void;
type Quuz = new (...args: any[]) => void;

interface Grault {
  (...args: any[]): void;
}
interface Corge {
  new (...args: any[]): void;
}
interface Garply {
  f(...args: any[]): void;
}
```

Examples of **correct** code for the `{ "ignoreRestArgs": true }` option:

```ts
/*eslint @typescript-eslint/no-explicit-any: ["error", { "ignoreRestArgs": true }]*/

function foo1(...args: any[]): void {}
function foo2(...args: readonly any[]): void {}
function foo3(...args: Array<any>): void {}
function foo4(...args: ReadonlyArray<any>): void {}

declare function bar(...args: any[]): void;

const baz = (...args: any[]) => {};
const qux = function (...args: any[]) {};

type Quux = (...args: any[]) => void;
type Quuz = new (...args: any[]) => void;

interface Grault {
  (...args: any[]): void;
}
interface Corge {
  new (...args: any[]): void;
}
interface Garply {
  f(...args: any[]): void;
}
```

## When Not To Use It

If an unknown type or a library without typings is used
and you want to be able to specify `any`.

## Further Reading

- TypeScript [any type](https://www.typescriptlang.org/docs/handbook/basic-types.html#any)

## Compatibility

- TSLint: [no-any](https://palantir.github.io/tslint/rules/no-any/)
