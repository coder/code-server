# Disallow usage of the implicit `any` type in catch clauses (`no-implicit-any-catch`)

TypeScript 4.0 added support for adding an explicit `any` or `unknown` type annotation on a catch clause variable.

By default, TypeScript will type a catch clause variable as `any`, so explicitly annotating it as `unknown` can add a lot of safety to your codebase.

The `noImplicitAny` flag in TypeScript does not cover this for backwards compatibility reasons.

## Rule Details

This rule requires an explicit type to be declared on a catch clause variable.

The following pattern is considered a warning:

```ts
try {
  // ...
} catch (e) {
  // ...
}
```

The following pattern is **_not_** considered a warning:

<!-- TODO: prettier currently removes the type annotations, re-enable this once prettier is updated -->
<!-- prettier-ignore-start -->

```ts
try {
  // ...
} catch (e: unknown) {
  // ...
}
```

<!-- prettier-ignore-end -->

## Options

The rule accepts an options object with the following properties:

```ts
type Options = {
  // if false, disallow specifying `: any` as the error type as well. See also `no-explicit-any`
  allowExplicitAny: boolean;
};

const defaults = {
  allowExplicitAny: false,
};
```

### `allowExplicitAny`

The follow is is **_not_** considered a warning with `{ allowExplicitAny: true }`

<!-- TODO: prettier currently removes the type annotations, re-enable this once prettier is updated -->
<!-- prettier-ignore-start -->

```ts
try {
  // ...
} catch (e: any) {
  // ...
}
```

<!-- prettier-ignore-end -->

## When Not To Use It

If you are not using TypeScript 4.0 (or greater), then you will not be able to use this rule, annotations on catch clauses is not supported.

## Further Reading

- [TypeScript 4.0 Beta Release Notes](https://devblogs.microsoft.com/typescript/announcing-typescript-4-0-beta/#unknown-on-catch)
