# Disallows unnecessary constraints on generic types (`no-unnecessary-type-constraint`)

## Rule Details

Type parameters (`<T>`) may be "constrained" with an `extends` keyword ([docs](https://www.typescriptlang.org/docs/handbook/generics.html#generic-constraints)).
When not provided, type parameters happen to default to:

- As of TypeScript 3.9: `unknown` ([docs](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html#type-parameters-that-extend-any-no-longer-act-as-any))
- Before that, as of 3.5: `any` ([docs](https://devblogs.microsoft.com/typescript/announcing-typescript-3-5/#breaking-changes))

It is therefore redundant to `extend` from these types in later versions of TypeScript.

Examples of **incorrect** code for this rule:

```ts
interface FooAny<T extends any> {}
interface FooUnknown<T extends unknown> {}

type BarAny<T extends any> = {};
type BarUnknown<T extends unknown> = {};

class BazAny<T extends any> {
  quxUnknown<U extends unknown>() {}
}

class BazUnknown<T extends unknown> {
  quxUnknown<U extends unknown>() {}
}

const QuuxAny = <T extends any>() => {};
const QuuxUnknown = <T extends unknown>() => {};

function QuuzAny<T extends any>() {}
function QuuzUnknown<T extends unknown>() {}
```

Examples of **correct** code for this rule:

```ts
interface Foo<T> {}

type Bar<T> = {};

class Baz<T> {
    qux<U> { }
}

const Quux = <T>() => {};

function Quuz<T>() {}
```

## When Not To Use It

If you don't care about the specific styles of your type constraints, or never use them in the first place, then you will not need this rule.
