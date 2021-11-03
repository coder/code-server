<h1 align="center">Utils for ESLint Plugins</h1>

<p align="center">Utilities for working with TypeScript + ESLint together.</p>

<p align="center">
    <img src="https://github.com/typescript-eslint/typescript-eslint/workflows/CI/badge.svg" alt="CI" />
    <a href="https://www.npmjs.com/package/@typescript-eslint/eslint-plugin"><img src="https://img.shields.io/npm/v/@typescript-eslint/eslint-plugin.svg?style=flat-square" alt="NPM Version" /></a>
    <a href="https://www.npmjs.com/package/@typescript-eslint/eslint-plugin"><img src="https://img.shields.io/npm/dm/@typescript-eslint/eslint-plugin.svg?style=flat-square" alt="NPM Downloads" /></a>
</p>

## Note

This package has inherited its version number from the `@typescript-eslint` project.
Meaning that even though this package is `2.x.y`, you shouldn't expect 100% stability between minor version bumps.
i.e. treat it as a `0.x.y` package.

Feel free to use it now, and let us know what utilities you need or send us PRs with utilities you build on top of it.

Once it is stable, it will be renamed to `@typescript-eslint/util` for a `4.0.0` release.

## Exports

| Name                                                           | Description                                                                                                                                                                                                                       |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`ASTUtils`](./src/ast-utils)                                  | Tools for operating on the ESTree AST. Also includes the [`eslint-utils`](https://www.npmjs.com/package/eslint-utils) package, correctly typed to work with the types found in `TSESTree`                                         |
| [`ESLintUtils`](./src/eslint-utils)                            | Tools for creating ESLint rules with TypeScript.                                                                                                                                                                                  |
| `JSONSchema`                                                   | Types from the [`@types/json-schema`](https://www.npmjs.com/package/@types/json-schema) package, re-exported to save you having to manually import them. Also ensures you're using the same version of the types as this package. |
| [`TSESLint`](./src/ts-eslint)                                  | Types for ESLint, correctly typed to work with the types found in `TSESTree`.                                                                                                                                                     |
| [`TSESLintScope`](./src/ts-eslint-scope)                       | The [`eslint-scope`](https://www.npmjs.com/package/eslint-scope) package, correctly typed to work with the types found in both `TSESTree` and `TSESLint`                                                                          |
| [`TSESTree`](../types/src/ts-estree.ts)                        | Types for the TypeScript flavor of ESTree created by `@typescript-eslint/typescript-estree`.                                                                                                                                      |
| [`AST_NODE_TYPES`](../types/src/ast-node-types.ts)             | An enum with the names of every single _node_ found in `TSESTree`.                                                                                                                                                                |
| [`AST_TOKEN_TYPES`](../types/src/ast-token-types.ts)           | An enum with the names of every single _token_ found in `TSESTree`.                                                                                                                                                               |
| [`ParserServices`](../typescript-estree/src/parser-options.ts) | Typing for the parser services provided when parsing a file using `@typescript-eslint/typescript-estree`.                                                                                                                         |

## Contributing

[See the contributing guide here](../../CONTRIBUTING.md)
