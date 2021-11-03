# Enforces consistent usage of type imports (`consistent-type-imports`)

TypeScript 3.8 added support for type-only imports.
Type-only imports allow you to specify that an import can only be used in a type location, allowing certain optimizations within compilers.

## Rule Details

This rule aims to standardize the use of type imports style across the codebase.

## Options

```ts
type Options = {
  prefer: 'type-imports' | 'no-type-imports';
  disallowTypeAnnotations: boolean;
};

const defaultOptions: Options = {
  prefer: 'type-imports',
  disallowTypeAnnotations: true,
};
```

### `prefer`

This option defines the expected import kind for type-only imports. Valid values for `prefer` are:

- `type-imports` will enforce that you always use `import type Foo from '...'` except referenced by metadata of decorators. It is default.
- `no-type-imports` will enforce that you always use `import Foo from '...'`.

Examples of **correct** code with `{prefer: 'type-imports'}`, and **incorrect** code with `{prefer: 'no-type-imports'}`.

```ts
import type { Foo } from 'Foo';
import type Bar from 'Bar';
type T = Foo;
const x: Bar = 1;
```

Examples of **incorrect** code with `{prefer: 'type-imports'}`, and **correct** code with `{prefer: 'no-type-imports'}`.

```ts
import { Foo } from 'Foo';
import Bar from 'Bar';
type T = Foo;
const x: Bar = 1;
```

### `disallowTypeAnnotations`

If `true`, type imports in type annotations (`import()`) is not allowed.
Default is `true`.

Examples of **incorrect** code with `{disallowTypeAnnotations: true}`.

```ts
type T = import('Foo').Foo;
const x: import('Bar') = 1;
```

## When Not To Use It

- If you are not using TypeScript 3.8 (or greater), then you will not be able to use this rule, as type-only imports are not allowed.
- Certain libraries use the non-inlined imports to infer information about the variables. For example, for dependency injection.<br/>
  type-only imports cannot be used with these libraries. See [#2559](https://github.com/typescript-eslint/typescript-eslint/issues/2559#issuecomment-692780580)
- If you specifically want to use both import kinds for stylistic reasons, you can disable this rule.
