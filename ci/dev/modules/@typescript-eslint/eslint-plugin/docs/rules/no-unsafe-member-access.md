# Disallows member access on any typed variables (`no-unsafe-member-access`)

Despite your best intentions, the `any` type can sometimes leak into your codebase.
Member access on `any` typed variables is not checked at all by TypeScript, so it creates a potential safety hole, and source of bugs in your codebase.

## Rule Details

This rule disallows member access on any variable that is typed as `any`.

Examples of **incorrect** code for this rule:

```ts
declare const anyVar: any;
declare const nestedAny: { prop: any };

anyVar.a;
anyVar.a.b;
anyVar['a'];
anyVar['a']['b'];

nestedAny.prop.a;
nestedAny.prop['a'];

const key = 'a';
nestedAny.prop[key];

// Using an any to access a member is unsafe
const arr = [1, 2, 3];
arr[anyVar];
nestedAny[anyVar];
```

Examples of **correct** code for this rule:

```ts
declare const properlyTyped: { prop: { a: string } };

properlyTyped.prop.a;
properlyTyped.prop['a'];

const key = 'a';
properlyTyped.prop[key];

const arr = [1, 2, 3];
arr[1];
const idx = 1;
arr[idx];
arr[idx++];
```

## Related to

- [`no-explicit-any`](./no-explicit-any.md)
- TSLint: [`no-unsafe-any`](https://palantir.github.io/tslint/rules/no-unsafe-any/)
