# Warns when a namespace qualifier is unnecessary (`no-unnecessary-qualifier`)

## Rule Details

This rule aims to let users know when a namespace or enum qualifier is unnecessary,
whether used for a type or for a value.

Examples of **incorrect** code for this rule:

```ts
namespace A {
  export type B = number;
  const x: A.B = 3;
}
```

```ts
namespace A {
  export const x = 3;
  export const y = A.x;
}
```

```ts
enum A {
  B,
  C = A.B,
}
```

```ts
namespace A {
  export namespace B {
    export type T = number;
    const x: A.B.T = 3;
  }
}
```

Examples of **correct** code for this rule:

```ts
namespace X {
  export type T = number;
}

namespace Y {
  export const x: X.T = 3;
}
```

```ts
enum A {
  X,
  Y,
}

enum B {
  Z = A.X,
}
```

```ts
namespace X {
  export type T = number;
  namespace Y {
    type T = string;
    const x: X.T = 0;
  }
}
```

## When Not To Use It

If you don't care about having unneeded namespace or enum qualifiers, then you don't need to use this rule.

## Further Reading

- TSLint: [no-unnecessary-qualifier](https://palantir.github.io/tslint/rules/no-unnecessary-qualifier/)
