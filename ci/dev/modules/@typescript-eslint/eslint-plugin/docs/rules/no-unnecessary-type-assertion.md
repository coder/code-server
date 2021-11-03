# Warns if a type assertion does not change the type of an expression (`no-unnecessary-type-assertion`)

This rule prohibits using a type assertion that does not change the type of an expression.

## Rule Details

This rule aims to prevent unnecessary type assertions.

Examples of **incorrect** code for this rule:

```ts
const foo = 3;
const bar = foo!;
```

```ts
const foo = <3>3;
```

```ts
type Foo = 3;
const foo = <Foo>3;
```

```ts
type Foo = 3;
const foo = 3 as Foo;
```

```ts
function foo(x: number): number {
  return x!; // unnecessary non-null
}
```

Examples of **correct** code for this rule:

```ts
const foo = <number>3;
```

```ts
const foo = 3 as number;
```

```ts
const foo = 'foo' as const;
```

```ts
function foo(x: number | undefined): number {
  return x!;
}
```

### Options

This rule optionally takes an object with a single property `typesToIgnore`, which can be set to a list of type names to ignore.

For example, with `@typescript-eslint/no-unnecessary-type-assertion: ["error", { typesToIgnore: ['Foo'] }]`, the following is **correct** code":

```ts
type Foo = 3;
const foo: Foo = 3;
```

## When Not To Use It

If you don't care about having no-op type assertions in your code, then you can turn off this rule.

## Related to

- TSLint: ['no-unnecessary-type-assertion`](https://palantir.github.io/tslint/rules/no-unnecessary-type-assertion/)
