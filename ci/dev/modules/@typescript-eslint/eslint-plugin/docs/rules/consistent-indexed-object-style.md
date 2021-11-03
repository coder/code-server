# Enforce or disallow the use of the record type (`consistent-indexed-object-style`)

TypeScript supports defining object show keys can be flexible using an index signature. TypeScript also has a builtin type named `Record` to create an empty object defining only an index signature. For example, the following types are equal:

```ts
interface Foo {
  [key: string]: unknown;
}

type Foo = {
  [key: string]: unknown;
};

type Foo = Record<string, unknown>;
```

## Options

- `"record"`: Set to `"record"` to only allow the `Record` type. Set to `"index-signature"` to only allow index signatures. (Defaults to `"record"`)

For example:

```CJSON
{
    "@typescript-eslint/consistent-indexed-object-style": ["error", "index-signature"]
}
```

## Rule details

This rule enforces a consistent way to define records.

Examples of **incorrect** code with `record` option.

```ts
interface Foo {
  [key: string]: unknown;
}

type Foo = {
  [key: string]: unknown;
};
```

Examples of **correct** code with `record` option.

```ts
type Foo = Record<string, unknown>;
```

Examples of **incorrect** code with `index-signature` option.

```ts
type Foo = Record<string, unknown>;
```

Examples of **correct** code with `index-signature` option.

```ts
interface Foo {
  [key: string]: unknown;
}

type Foo = {
  [key: string]: unknown;
};
```
