# Disallows calling an function with an any type value (`no-unsafe-argument`)

Despite your best intentions, the `any` type can sometimes leak into your codebase.
Call a function with `any` typed argument are not checked at all by TypeScript, so it creates a potential safety hole, and source of bugs in your codebase.

## Rule Details

This rule disallows calling a function with `any` in its arguments, and it will disallow spreading `any[]`.
This rule also disallows spreading a tuple type with one of its elements typed as `any`.
This rule also compares the argument's type to the variable's type to ensure you don't pass an unsafe `any` in a generic position to a receiver that's expecting a specific type. For example, it will error if you assign `Set<any>` to an argument declared as `Set<string>`.

Examples of **incorrect** code for this rule:

```ts
declare function foo(arg1: string, arg2: number, arg2: string): void;

const anyTyped = 1 as any;

foo(...anyTyped);
foo(anyTyped, 1, 'a');

const anyArray: any[] = [];
foo(...anyArray);

const tuple1 = ['a', anyTyped, 'b'] as const;
foo(...tuple1);

const tuple2 = [1] as const;
foo('a', ...tuple, anyTyped);

declare function bar(arg1: string, arg2: number, ...rest: string[]): void;
const x = [1, 2] as [number, ...number[]];
foo('a', ...x, anyTyped);

declare function baz(arg1: Set<string>, arg2: Map<string, string>): void;
foo(new Set<any>(), new Map<any, string>());
```

Examples of **correct** code for this rule:

```ts
declare function foo(arg1: string, arg2: number, arg2: string): void;

foo('a', 1, 'b');

const tuple1 = ['a', 1, 'b'] as const;
foo(...tuple1);

declare function bar(arg1: string, arg2: number, ...rest: string[]): void;
const array: string[] = ['a'];
bar('a', 1, ...array);

declare function baz(arg1: Set<string>, arg2: Map<string, string>): void;
foo(new Set<string>(), new Map<string, string>());
```

There are cases where the rule allows passing an argument of `any` to `unknown`.

Example of `any` to `unknown` assignment that are allowed.

```ts
declare function foo(arg1: unknown, arg2: Set<unkown>, arg3: unknown[]): void;
foo(1 as any, new Set<any>(), [] as any[]);
```

## Related to

- [`no-explicit-any`](./no-explicit-any.md)
- TSLint: [`no-unsafe-any`](https://palantir.github.io/tslint/rules/no-unsafe-any/)
