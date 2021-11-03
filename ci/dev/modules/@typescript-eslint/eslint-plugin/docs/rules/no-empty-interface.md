# Disallow the declaration of empty interfaces (`no-empty-interface`)

An empty interface is equivalent to its supertype. If the interface does not implement a supertype, then
the interface is equivalent to an empty object (`{}`). In both cases it can be omitted.

## Rule Details

This rule aims to ensure that only meaningful interfaces are declared in the code.

The following patterns are considered warnings:

```ts
// an empty interface
interface Foo {}

// an interface with only one supertype (Bar === Foo)
interface Bar extends Foo {}

// an interface with an empty list of supertypes
interface Baz {}
```

The following patterns are not warnings:

```ts
// an interface with any number of members
interface Foo {
  name: string;
}

// same as above
interface Bar {
  age: number;
}

// an interface with more than one supertype
// in this case the interface can be used as a replacement of a union type.
interface Baz extends Foo, Bar {}
```

### Options

This rule accepts a single object option with the following default configuration:

```json
{
  "@typescript-eslint/no-empty-interface": [
    "error",
    {
      "allowSingleExtends": false
    }
  ]
}
```

- `allowSingleExtends: true` will silence warnings about extending a single interface without adding additional members

## When Not To Use It

If you don't care about having empty/meaningless interfaces, then you will not need this rule.

## Compatibility

- TSLint: [no-empty-interface](https://palantir.github.io/tslint/rules/no-empty-interface/)
