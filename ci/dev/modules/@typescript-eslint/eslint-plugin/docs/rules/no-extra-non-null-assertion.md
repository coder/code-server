# Disallow extra non-null assertion (`no-extra-non-null-assertion`)

## Rule Details

Examples of **incorrect** code for this rule:

```ts
const foo: { bar: number } | null = null;
const bar = foo!!!.bar;
```

```ts
function foo(bar: number | undefined) {
  const bar: number = bar!!!;
}
```

```ts
function foo(bar?: { n: number }) {
  return bar!?.n;
}
```

Examples of **correct** code for this rule:

```ts
const foo: { bar: number } | null = null;
const bar = foo!.bar;
```

```ts
function foo(bar: number | undefined) {
  const bar: number = bar!;
}
```

```ts
function foo(bar?: { n: number }) {
  return bar?.n;
}
```

## How to use

```json
{
  "@typescript-eslint/no-extra-non-null-assertion": ["error"]
}
```
