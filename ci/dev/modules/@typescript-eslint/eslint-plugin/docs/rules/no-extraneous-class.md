# Forbids the use of classes as namespaces (`no-extraneous-class`)

This rule warns when a class is accidentally used as a namespace.

## Rule Details

From TSLint’s docs:

> Users who come from a Java-style OO language may wrap their utility functions in an extra class,
> instead of putting them at the top level.

Examples of **incorrect** code for this rule:

```ts
class EmptyClass {}

class ConstructorOnly {
  constructor() {
    foo();
  }
}

// Use an object instead:
class StaticOnly {
  static version = 42;
  static hello() {
    console.log('Hello, world!');
  }
}
```

Examples of **correct** code for this rule:

```ts
class EmptyClass extends SuperClass {}

class ParameterProperties {
  constructor(public name: string) {}
}

const StaticOnly = {
  version: 42,
  hello() {
    console.log('Hello, world!');
  },
};
```

### Options

This rule accepts a single object option.

```ts
type Options = {
  // allow extraneous classes if they only contain a constructor
  allowConstructorOnly?: boolean;
  // allow extraneous classes if they have no body (i.e. are empty)
  allowEmpty?: boolean;
  // allow extraneous classes if they only contain static members
  allowStaticOnly?: boolean;
  // allow extraneous classes if they have a decorator
  allowWithDecorator?: boolean;
};

const defaultOptions: Options = {
  allowConstructorOnly: false,
  allowEmpty: false,
  allowStaticOnly: false,
  allowWithDecorator: false,
};
```

## When Not To Use It

You can disable this rule if you don’t have anyone who would make these kinds of mistakes on your
team or if you use classes as namespaces.

## Compatibility

[`no-unnecessary-class`](https://palantir.github.io/tslint/rules/no-unnecessary-class/) from TSLint
