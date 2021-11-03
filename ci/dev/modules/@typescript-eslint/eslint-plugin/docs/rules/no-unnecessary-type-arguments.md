# Enforces that type arguments will not be used if not required (`no-unnecessary-type-arguments`)

Warns if an explicitly specified type argument is the default for that type parameter.

## Rule Details

Type parameters in TypeScript may specify a default value.
For example:

```ts
function f<T = number>() {}
```

It is redundant to provide an explicit type parameter equal to that default.

Examples of **incorrect** code for this rule:

```ts
function f<T = number>() {}
f<number>();

function g<T = number, U = string>() {}
g<string, string>();

class C<T = number> {}
function h(c: C<number>) {}
new C<number>();
class D extends C<number> {}

interface I<T = number> {}
class Impl implements I<number> {}
```

Examples of **correct** code for this rule:

```ts
function f<T = number>() {}
f<string>();

function g<T = number, U = string>() {}
g<number, number>();

class C<T = number> {}
new C<string>();
class D extends C<string> {}

interface I<T = number> {}
class Impl implements I<string> {}
```

## Related to

- TSLint: [use-default-type-parameter](https://palantir.github.io/tslint/rules/use-default-type-parameter)
