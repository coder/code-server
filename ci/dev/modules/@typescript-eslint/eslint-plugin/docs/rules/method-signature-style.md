# Enforces using a particular method signature syntax. (`method-signature-style`)

There are two ways to define an object/interface function property.

```ts
// method shorthand syntax
interface T1 {
  func(arg: string): number;
}

// regular property with function type
interface T2 {
  func: (arg: string) => number;
}
```

A good practice is to use the TypeScript's `strict` option (which implies `strictFunctionTypes`) which enables correct typechecking for function properties only (method signatures get old behavior).

TypeScript FAQ:

> A method and a function property of the same type behave differently.
> Methods are always bivariant in their argument, while function properties are contravariant in their argument under `strictFunctionTypes`.

See the reasoning behind that in the [TypeScript PR for the compiler option](https://github.com/microsoft/TypeScript/pull/18654).

## Options

This rule accepts one string option:

- `"property"`: Enforce using property signature for functions. Use this to enforce maximum correctness together with TypeScript's strict mode.
- `"method"`: Enforce using method signature for functions. Use this if you aren't using TypeScript's strict mode and prefer this style.

The default is `"property"`.

## Rule Details

Examples of **incorrect** code with `property` option.

```ts
interface T1 {
  func(arg: string): number;
}
type T2 = {
  func(arg: boolean): void;
};
interface T3 {
  func(arg: number): void;
  func(arg: string): void;
  func(arg: boolean): void;
}
```

Examples of **correct** code with `property` option.

```ts
interface T1 {
  func: (arg: string) => number;
}
type T2 = {
  func: (arg: boolean) => void;
};
// this is equivalent to the overload
interface T3 {
  func: ((arg: number) => void) &
    ((arg: string) => void) &
    ((arg: boolean) => void);
}
```

Examples of **incorrect** code with `method` option.

```ts
interface T1 {
  func: (arg: string) => number;
}
type T2 = {
  func: (arg: boolean) => void;
};
```

Examples of **correct** code with `method` option.

```ts
interface T1 {
  func(arg: string): number;
}
type T2 = {
  func(arg: boolean): void;
};
```

## When Not To Use It

If you don't want to enforce a particular style for object/interface function types, and/or if you don't use `strictFunctionTypes`, then you don't need this rule.
