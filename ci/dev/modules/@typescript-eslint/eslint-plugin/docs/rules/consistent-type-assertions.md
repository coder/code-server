# Enforces consistent usage of type assertions (`consistent-type-assertions`)

## Rule Details

This rule aims to standardize the use of type assertion style across the codebase.

Type assertions are also commonly referred as "type casting" in TypeScript (even though it is technically slightly different to what is understood by type casting in other languages), so you can think of type assertions and type casting referring to the same thing. It is essentially you saying to the TypeScript compiler, "in this case, I know better than you!".

In addition to ensuring that type assertions are written in a consistent way, this rule also helps make your codebase more type-safe.

`const` assertions, [introduced in TypeScript 3.4](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions), is always allowed by this rule. Examples of it include `let x = "hello" as const;` and `let x = <const>"hello";`.

## Options

```ts
type Options =
  | {
      assertionStyle: 'as' | 'angle-bracket';
      objectLiteralTypeAssertions: 'allow' | 'allow-as-parameter' | 'never';
    }
  | {
      assertionStyle: 'never';
    };

const defaultOptions: Options = {
  assertionStyle: 'as',
  objectLiteralTypeAssertions: 'allow',
};
```

### `assertionStyle`

This option defines the expected assertion style. Valid values for `assertionStyle` are:

- `as` will enforce that you always use `... as foo`.
- `angle-bracket` will enforce that you always use `<foo>...`
- `never` will enforce that you do not do any type assertions.

Most codebases will want to enforce not using `angle-bracket` style because it conflicts with JSX syntax, and is confusing when paired with generic syntax.

Some codebases like to go for an extra level of type safety, and ban assertions altogether via the `never` option.

### `objectLiteralTypeAssertions`

Always prefer `const x: T = { ... };` to `const x = { ... } as T;` (or similar with angle brackets). The type assertion in the latter case is either unnecessary or will probably hide an error.

The compiler will warn for excess properties with this syntax, but not missing _required_ fields. For example: `const x: { foo: number } = {};` will fail to compile, but `const x = {} as { foo: number }` will succeed.

The const assertion `const x = { foo: 1 } as const`, introduced in TypeScript 3.4, is considered beneficial and is ignored by this option.

Assertions to `any` are also ignored by this option.

Examples of **incorrect** code for `{ assertionStyle: 'as', objectLiteralTypeAssertions: 'never' }` (and for `{ assertionStyle: 'as', objectLiteralTypeAssertions: 'allow-as-parameter' }`)

```ts
const x = { ... } as T;

function foo() {
  return { ... } as T;
}
```

Examples of **correct** code for `{ assertionStyle: 'as', objectLiteralTypeAssertions: 'never' }`.

```ts
const x: T = { ... };
const y = { ... } as any;
const z = { ... } as unknown;

function foo(): T {
  return { ... };
}
```

Examples of **correct** code for `{ assertionStyle: 'as', objectLiteralTypeAssertions: 'allow-as-parameter' }`.

```tsx
const x: T = { ... };
const y = { ... } as any;
const z = { ... } as unknown;
foo({ ... } as T);
new Clazz({ ... } as T);
function foo() { throw { bar: 5 } as Foo }
const foo = <Foo props={{ ... } as Bar}/>;
```

## When Not To Use It

If you do not want to enforce consistent type assertions.

## Compatibility

- TSLint: [no-angle-bracket-type-assertion](https://palantir.github.io/tslint/rules/no-angle-bracket-type-assertion/)
- TSLint: [no-object-literal-type-assertion](https://palantir.github.io/tslint/rules/no-object-literal-type-assertion/)
