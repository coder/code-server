# Disallow non-null assertion in locations that may be confusing (`no-confusing-non-null-assertion`)

## Rule Details

Using a non-null assertion (`!`) next to an assign or equals check (`=` or `==` or `===`) creates code that is confusing as it looks similar to a not equals check (`!=` `!==`).

```typescript
a! == b; // a non-null assertions(`!`) and an equals test(`==`)
a !== b; // not equals test(`!==`)
a! === b; // a non-null assertions(`!`) and an triple equals test(`===`)
```

Examples of **incorrect** code for this rule:

```ts
interface Foo {
  bar?: string;
  num?: number;
}

const foo: Foo = getFoo();
const isEqualsBar = foo.bar! == 'hello';
const isEqualsNum = 1 + foo.num! == 2;
```

Examples of **correct** code for this rule:

<!-- prettier-ignore -->
```ts
interface Foo {
  bar?: string;
  num?: number;
}

const foo: Foo = getFoo();
const isEqualsBar = foo.bar == 'hello';
const isEqualsNum = (1 + foo.num!) == 2;
```

## When Not To Use It

If you don't care about this confusion, then you will not need this rule.

## Further Reading

- [`Issue: Easy misunderstanding: "! ==="`](https://github.com/microsoft/TypeScript/issues/37837) in [TypeScript repo](https://github.com/microsoft/TypeScript)
