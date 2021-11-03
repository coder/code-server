# Disallow the use of custom TypeScript modules and namespaces (`no-namespace`)

Custom TypeScript modules (`module foo {}`) and namespaces (`namespace foo {}`) are considered outdated
ways to organize TypeScript code. ES2015 module syntax is now preferred (`import`/`export`).

This rule still allows the use of TypeScript module declarations to describe external APIs (`declare module 'foo' {}`).

## Rule Details

This rule aims to standardize the way modules are declared.

## Options

This rule, in its default state, does not require any argument. If you would like to enable one
or more of the following you may pass an object with the options set as follows:

- `allowDeclarations` set to `true` will allow you to `declare` custom TypeScript modules and namespaces (Default: `false`).
- `allowDefinitionFiles` set to `true` will allow you to `declare` and use custom TypeScript modules and namespaces
  inside definition files (Default: `true`).

Examples of **incorrect** code for the default `{ "allowDeclarations": false, "allowDefinitionFiles": true }` options:

```ts
module foo {}
namespace foo {}

declare module foo {}
declare namespace foo {}
```

Examples of **correct** code for the default `{ "allowDeclarations": false, "allowDefinitionFiles": true }` options:

```ts
declare module 'foo' {}

// anything inside a d.ts file
```

### `allowDeclarations`

Examples of **incorrect** code for the `{ "allowDeclarations": true }` option:

```ts
module foo {}
namespace foo {}
```

Examples of **correct** code for the `{ "allowDeclarations": true }` option:

```ts
declare module 'foo' {}
declare module foo {}
declare namespace foo {}

declare global {
  namespace foo {}
}

declare module foo {
  namespace foo {}
}
```

Examples of **incorrect** code for the `{ "allowDeclarations": false }` option:

```ts
module foo {}
namespace foo {}
declare module foo {}
declare namespace foo {}
```

Examples of **correct** code for the `{ "allowDeclarations": false }` option:

```ts
declare module 'foo' {}
```

### `allowDefinitionFiles`

Examples of **incorrect** code for the `{ "allowDefinitionFiles": true }` option:

```ts
// if outside a d.ts file
module foo {}
namespace foo {}

// if outside a d.ts file and allowDeclarations = false
module foo {}
namespace foo {}
declare module foo {}
declare namespace foo {}
```

Examples of **correct** code for the `{ "allowDefinitionFiles": true }` option:

```ts
declare module 'foo' {}

// anything inside a d.ts file
```

## When Not To Use It

If you are using the ES2015 module syntax, then you will not need this rule.

## Further Reading

- [Modules](https://www.typescriptlang.org/docs/handbook/modules.html)
- [Namespaces](https://www.typescriptlang.org/docs/handbook/namespaces.html)
- [Namespaces and Modules](https://www.typescriptlang.org/docs/handbook/namespaces-and-modules.html)

## Compatibility

- TSLint: [no-namespace](https://palantir.github.io/tslint/rules/no-namespace/)
