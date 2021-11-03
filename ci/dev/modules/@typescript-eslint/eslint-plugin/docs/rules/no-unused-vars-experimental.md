# Disallow unused variables and arguments (`no-unused-vars-experimental`)

Variables that are declared and not used anywhere in the code are most likely an error due to incomplete refactoring. Such variables take up space in the code and can lead to confusion by readers.

## Rule Details

This rule leverages the TypeScript compiler's unused variable checks to report. This means that with all rule options set to `false`, it should report the same errors as if you used both the `noUnusedLocals` and `noUnusedParameters` compiler options.

This rule is vastly different to, and maintains no compatibility with the base ESLint version of the rule.

### Limitations

There are two limitations to this rule when compared with ESLint's `no-unused-vars` rule, which are imposed by the fact that it directly uses TypeScript's implementation.

1. This rule only works on files that TypeScript deems is a module (i.e. it has an `import` or an `export` statement).
2. The rule is significantly less configurable, as it cannot deviate too far from the base implementation.

## Supported Nodes

This rule supports checks on the following features:

- Declarations:
  - `var` / `const` / `let`
  - `function`
  - `class`
  - `enum`
  - `interface`
  - `type`
- Class methods
- Class properties and parameter properties
- Function parameters
- Generic type parameters
- Import statements

## Options

```ts
type Options = {
  ignoredNamesRegex?: string | boolean;
  ignoreArgsIfArgsAfterAreUsed?: boolean;
};

const defaultOptions: Options = {
  ignoredNamesRegex: '^_',
  ignoreArgsIfArgsAfterAreUsed: false,
};
```

### `ignoredNamesRegex`

This option accepts a regex string to match names against.
Any matched names will be ignored and have no errors reported.
If you set it to false, it will never ignore any names.

The default value is `'^_'` (i.e. matches any name prefixed with an underscore).

Examples of valid code with `{ variables: { ignoredNamesRegex: '^_' } }`.

```ts
const _unusedVar = 'unused';
class _Unused {
  private _unused = 1;
  private _unusedMethod() {}
}
function _unusedFunction() {}
enum _UnusedEnum {
  a = 1,
}
interface _UnusedInterface {}
type _UnusedType = {};
```

**_NOTE:_** The TypeScript compiler automatically ignores imports, function arguments, type parameter declarations, and object destructuring variables prefixed with an underscore.
As this is hard-coded into the compiler, we cannot change this.

Examples of valid code based on the unchangeable compiler settings

```ts
import _UnusedDefault, { _UnusedNamed } from 'foo';
export function foo(_unusedProp: string) {}
export class Foo<_UnusedGeneric> {}
const { prop: _unusedDestructure } = foo;
```

## `ignoreArgsIfArgsAfterAreUsed`

When true, this option will ignore unused function arguments if the arguments proceeding arguments are used.

Examples of invalid code with `{ ignoreArgsIfArgsAfterAreUsed: false }`

```ts
function foo(unused: string, used: number) {
  console.log(used);
}

class Foo {
  constructor(unused: string, public used: number) {
    console.log(used);
  }
}
```

Examples of valid code with `{ ignoreArgsIfArgsAfterAreUsed: true }`

```ts
function foo(unused: string, used: number) {
  console.log(used);
}

class Foo {
  constructor(unused: string, public used: number) {
    console.log(used);
  }
}
```
