# Prefer usage of `as const` over literal type (`prefer-as-const`)

This rule recommends usage of `const` assertion when type primitive value is equal to type.

## Rule Details

Examples of **incorrect** code for this rule:

```ts
let bar: 2 = 2;
let foo = <'bar'>'bar';
let foo = { bar: 'baz' as 'baz' };
```

Examples of **correct** code for this rule:

```ts
let foo = 'bar';
let foo = 'bar' as const;
let foo: 'bar' = 'bar' as const;
let bar = 'bar' as string;
let foo = <string>'bar';
let foo = { bar: 'baz' };
```

## When Not To Use It

If you are using TypeScript < 3.4
