# Prefer using type parameter when calling `Array#reduce` instead of casting (`prefer-reduce-type-parameter`)

It's common to call `Array#reduce` with a generic type, such as an array or object, as the initial value.
Since these values are empty, their types are not usable:

- `[]` has type `never[]`, which can't have items pushed into it as nothing is type `never`
- `{}` has type `{}`, which doesn't have an index signature and so can't have properties added to it

A common solution to this problem is to cast the initial value. While this will work, it's not the most optimal
solution as casting has subtle effects on the underlying types that can allow bugs to slip in.

A better (and lesser known) solution is to pass the type in as a generic parameter to `Array#reduce` explicitly.
This means that TypeScript doesn't have to try to infer the type, and avoids the common pitfalls that come with casting.

## Rule Details

This rule looks for calls to `Array#reduce`, and warns if an initial value is being passed & casted,
suggesting instead to pass the cast type to `Array#reduce` as its generic parameter.

Examples of **incorrect** code for this rule:

```ts
[1, 2, 3].reduce((arr, num) => arr.concat(num * 2), [] as number[]);

['a', 'b'].reduce(
  (accum, name) => ({
    ...accum,
    [name]: true,
  }),
  {} as Record<string, boolean>,
);
```

Examples of **correct** code for this rule:

```ts
[1, 2, 3].reduce<number[]>((arr, num) => arr.concat(num * 2), []);

['a', 'b'].reduce<Record<string, boolean>>(
  (accum, name) => ({
    ...accum,
    [name]: true,
  }),
  {},
);
```

## Options

There are no options.

## When Not To Use It

If you don't want to use typechecking in your linting, you can't use this rule.
