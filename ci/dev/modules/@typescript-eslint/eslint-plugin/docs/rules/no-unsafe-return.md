# Disallows returning any from a function (`no-unsafe-return`)

Despite your best intentions, the `any` type can sometimes leak into your codebase.
Returned `any` typed values are not checked at all by TypeScript, so it creates a potential safety hole, and source of bugs in your codebase.

## Rule Details

This rule disallows returning `any` or `any[]` from a function.
This rule also compares the return type to the function's declared/inferred return type to ensure you don't return an unsafe `any` in a generic position to a receiver that's expecting a specific type. For example, it will error if you return `Set<any>` from a function declared as returning `Set<string>`.

Examples of **incorrect** code for this rule:

```ts
function foo1() {
  return 1 as any;
}
function foo2() {
  return Object.create(null);
}
const foo3 = () => {
  return 1 as any;
};
const foo4 = () => Object.create(null);

function foo5() {
  return [] as any[];
}
function foo6() {
  return [] as Array<any>;
}
function foo7() {
  return [] as readonly any[];
}
function foo8() {
  return [] as Readonly<any[]>;
}
const foo9 = () => {
  return [] as any[];
};
const foo10 = () => [] as any[];

const foo11 = (): string[] => [1, 2, 3] as any[];

// generic position examples
function assignability1(): Set<string> {
  return new Set<any>([1]);
}
type TAssign = () => Set<string>;
const assignability2: TAssign = () => new Set<any>([true]);
```

Examples of **correct** code for this rule:

```ts
function foo1() {
  return 1;
}
function foo2() {
  return Object.create(null) as Record<string, unknown>;
}

const foo3 = () => [];
const foo4 = () => ['a'];

function assignability1(): Set<string> {
  return new Set<string>(['foo']);
}
type TAssign = () => Set<string>;
const assignability2: TAssign = () => new Set(['foo']);
```

There are cases where the rule allows to return `any` to `unknown`.

Examples of `any` to `unknown` return that are allowed.

```ts
function foo1(): unknown {
  return JSON.parse(singleObjString); // Return type for JSON.parse is any.
}

function foo2(): unknown[] {
  return [] as any[];
}
```

## Related to

- [`no-explicit-any`](./no-explicit-any.md)
- TSLint: [`no-unsafe-any`](https://palantir.github.io/tslint/rules/no-unsafe-any/)
