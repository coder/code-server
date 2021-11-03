<h1 align="center">TypeScript Scope Manager</h1>

<p align="center">
    <img src="https://github.com/typescript-eslint/typescript-eslint/workflows/CI/badge.svg" alt="CI" />
    <a href="https://www.npmjs.com/package/@typescript-eslint/scope-manager"><img src="https://img.shields.io/npm/v/@typescript-eslint/scope-manager.svg?style=flat-square" alt="NPM Version" /></a>
    <a href="https://www.npmjs.com/package/@typescript-eslint/scope-manager"><img src="https://img.shields.io/npm/dm/@typescript-eslint/scope-manager.svg?style=flat-square" alt="NPM Downloads" /></a>
</p>

This is a fork of [`eslint-scope`](https://github.com/eslint/eslint-scope), enhanced to support TypeScript functionality.
[You can view the original licence for the code here](https://github.com/eslint/eslint-scope/blob/dbddf14d5771b21b5da704213e4508c660ca1c64/LICENSE).

This package is consumed automatically by [`@typescript-eslint/parser`](../parser).
You probably don't want to use it directly.

## Getting Started

**[You can find our Getting Started docs here](../../docs/getting-started/linting/README.md)**

## Installation

```bash
$ yarn add -D typescript @typescript-eslint/scope-manager
$ npm i --save-dev typescript @typescript-eslint/scope-manager
```

## API

### `analyze(tree, options)`

Analyses a given AST and returns the resulting `ScopeManager`.

```ts
interface AnalyzeOptions {
  /**
   * Known visitor keys.
   */
  childVisitorKeys?: Record<string, string[]> | null;

  /**
   * Which ECMAScript version is considered.
   * Defaults to `2018`.
   */
  ecmaVersion?: EcmaVersion;

  /**
   * Whether the whole script is executed under node.js environment.
   * When enabled, the scope manager adds a function scope immediately following the global scope.
   * Defaults to `false`.
   */
  globalReturn?: boolean;

  /**
   * Implied strict mode (if ecmaVersion >= 5).
   * Defaults to `false`.
   */
  impliedStrict?: boolean;

  /**
   * The identifier that's used for JSX Element creation (after transpilation).
   * This should not be a member expression - just the root identifier (i.e. use "React" instead of "React.createElement").
   * Defaults to `"React"`.
   */
  jsxPragma?: string;

  /**
   * The identifier that's used for JSX fragment elements (after transpilation).
   * If `null`, assumes transpilation will always use a member on `jsxFactory` (i.e. React.Fragment).
   * This should not be a member expression - just the root identifier (i.e. use "h" instead of "h.Fragment").
   * Defaults to `null`.
   */
  jsxFragmentName?: string | null;

  /**
   * The lib used by the project.
   * This automatically defines a type variable for any types provided by the configured TS libs.
   * For more information, see https://www.typescriptlang.org/tsconfig#lib
   *
   * Defaults to the lib for the provided `ecmaVersion`.
   */
  lib?: Lib[];

  /**
   * The source type of the script.
   */
  sourceType?: 'script' | 'module';

  /**
   * Emit design-type metadata for decorated declarations in source.
   * Defaults to `false`.
   */
  emitDecoratorMetadata?: boolean;
}
```

Example usage:

```ts
import { analyze } from '@typescript-eslint/scope-manager';
import { parse } from '@typescript-eslint/typescript-estree';

const code = `const hello: string = 'world';`;
const ast = parse(code, {
  // note that scope-manager requires ranges on the AST
  range: true,
});
const scope = analyze(ast, {
  ecmaVersion: 2020,
  sourceType: 'module',
});
```

## References

- https://eslint.org/docs/developer-guide/scope-manager-interface
- https://github.com/eslint/eslint-scope

## Contributing

[See the contributing guide here](../../CONTRIBUTING.md)
