# Require consistent spacing around type annotations (`type-annotation-spacing`)

Spacing around type annotations improves readability of the code. Although the most commonly used style guideline for type annotations in TypeScript prescribes adding a space after the colon, but not before it, it is subjective to the preferences of a project. For example:

<!-- prettier-ignore -->
```ts
// with space after, but not before (default if no option is specified)
let foo: string = "bar";

// with no spaces
let foo:string = "bar";

// with space before and after
let foo : string = "bar";

// with space before, but not after
let foo :string = "bar";

// with spaces before and after the fat arrow (default if no option is specified)
type Foo = (string: name) => string;

// with no spaces between the fat arrow
type Foo = (string: name)=>string;

// with space after, but not before the fat arrow
type Foo = (string: name)=> string;

// with space before, but not after the fat arrow
type Foo = (string: name) =>string;
```

## Rule Details

This rule aims to enforce specific spacing patterns around type annotations and function types in type literals.

## Options

This rule has an object option:

- `"before": false`, (default for colon) disallows spaces before the colon/arrow.
- `"before": true`, (default for arrow) requires a space before the colon/arrow.
- `"after": true`, (default) requires a space after the colon/arrow.
- `"after": false`, disallows spaces after the colon/arrow.
- `"overrides"`, overrides the default options for type annotations with `colon` (e.g. `const foo: string`) and function types with `arrow` (e.g. `type Foo = () => {}`). Additionally allows granular overrides for `variable` (`const foo: string`),`parameter` (`function foo(bar: string) {...}`),`property` (`interface Foo { bar: string }`) and `returnType` (`function foo(): string {...}`) annotations.

### defaults

Examples of **incorrect** code for this rule with no options at all:

<!-- prettier-ignore -->
```ts
let foo:string = "bar";
let foo :string = "bar";
let foo : string = "bar";

function foo():string {}
function foo() :string {}
function foo() : string {}

class Foo {
    name:string;
}

class Foo {
    name :string;
}

class Foo {
    name : string;
}

type Foo = ()=>{};
type Foo = () =>{};
type Foo = ()=> {};
```

Examples of **correct** code for this rule with no options at all:

<!-- prettier-ignore -->
```ts
let foo: string = "bar";

function foo(): string {}

class Foo {
    name: string;
}

type Foo = () => {};
```

### after

Examples of **incorrect** code for this rule with `{ "before": false, "after": true }`:

<!-- prettier-ignore -->
```ts
let foo:string = "bar";
let foo :string = "bar";
let foo : string = "bar";

function foo():string {}
function foo() :string {}
function foo() : string {}

class Foo {
    name:string;
}

class Foo {
    name :string;
}

class Foo {
    name : string;
}

type Foo = ()=>{};
type Foo = () =>{};
type Foo = () => {};
```

Examples of **correct** code for this rule with `{ "before": false, "after": true }`:

<!-- prettier-ignore -->
```ts
let foo: string = "bar";

function foo(): string {}

class Foo {
    name: string;
}

type Foo = ()=> {};
```

### before

Examples of **incorrect** code for this rule with `{ "before": true, "after": true }` options:

<!-- prettier-ignore -->
```ts
let foo: string = "bar";
let foo:string = "bar";
let foo :string = "bar";

function foo(): string {}
function foo():string {}
function foo() :string {}

class Foo {
    name: string;
}

class Foo {
    name:string;
}

class Foo {
    name :string;
}

type Foo = ()=>{};
type Foo = () =>{};
type Foo = ()=> {};
```

Examples of **correct** code for this rule with `{ "before": true, "after": true }` options:

<!-- prettier-ignore -->
```ts
let foo : string = "bar";

function foo() : string {}

class Foo {
    name : string;
}

type Foo = () => {};
```

### overrides - colon

Examples of **incorrect** code for this rule with `{ "before": false, "after": false, overrides: { colon: { before: true, after: true }} }` options:

<!-- prettier-ignore -->
```ts
let foo: string = "bar";
let foo:string = "bar";
let foo :string = "bar";

function foo(): string {}
function foo():string {}
function foo() :string {}

class Foo {
    name: string;
}

class Foo {
    name:string;
}

class Foo {
    name :string;
}

type Foo = () =>{};
type Foo = ()=> {};
type Foo = () => {};
```

Examples of **correct** code for this rule with `{ "before": false, "after": false, overrides: { colon: { before: true, after: true }} }` options:

<!-- prettier-ignore -->
```ts
let foo : string = "bar";

function foo() : string {}

class Foo {
    name : string;
}

type Foo = {
    name: (name : string)=>string;
}

type Foo = ()=>{};
```

### overrides - arrow

Examples of **incorrect** code for this rule with `{ "before": false, "after": false, overrides: { arrow: { before: true, after: true }} }` options:

<!-- prettier-ignore -->
```ts
let foo: string = "bar";
let foo : string = "bar";
let foo :string = "bar";

function foo(): string {}
function foo():string {}
function foo() :string {}

class Foo {
    name: string;
}

class Foo {
    name : string;
}

class Foo {
    name :string;
}

type Foo = ()=>{};
type Foo = () =>{};
type Foo = ()=> {};
```

Examples of **correct** code for this rule with `{ "before": false, "after": false, overrides: { arrow: { before: true, after: true }} }` options:

<!-- prettier-ignore -->
```ts
let foo:string = "bar";

function foo():string {}

class Foo {
    name:string;
}

type Foo = () => {};
```

## When Not To Use It

If you don't want to enforce spacing for your type annotations, you can safely turn this rule off.

## Further Reading

- [TypeScript Type System](https://basarat.gitbooks.io/typescript/docs/types/type-system.html)
- [Type Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)

## Compatibility

- TSLint: [`typedef-whitespace`](https://palantir.github.io/tslint/rules/typedef-whitespace/)
