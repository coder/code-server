# Enforce valid definition of `new` and `constructor` (`no-misused-new`)

Warns on apparent attempts to define constructors for interfaces or `new` for classes.

## Rule Details

Examples of **incorrect** code for this rule.

```ts
class C {
  new(): C;
}

interface I {
  new (): I;
  constructor(): void;
}
```

Examples of **correct** code for this rule.

```ts
class C {
  constructor() {}
}
interface I {
  new (): C;
}
```

## Options

```json
{
  "@typescript-eslint/no-misused-new": "error"
}
```

## Compatibility

- TSLint: [no-misused-new](https://palantir.github.io/tslint/rules/no-misused-new/)
