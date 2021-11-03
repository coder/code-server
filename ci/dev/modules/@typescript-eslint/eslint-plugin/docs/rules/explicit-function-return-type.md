# Require explicit return types on functions and class methods (`explicit-function-return-type`)

Explicit types for function return values makes it clear to any calling code what type is returned.
This ensures that the return value is assigned to a variable of the correct type; or in the case
where there is no return value, that the calling code doesn't try to use the undefined value when it
shouldn't.

## Rule Details

This rule aims to ensure that the values returned from functions are of the expected type.

The following patterns are considered warnings:

```ts
// Should indicate that no value is returned (void)
function test() {
  return;
}

// Should indicate that a number is returned
var fn = function () {
  return 1;
};

// Should indicate that a string is returned
var arrowFn = () => 'test';

class Test {
  // Should indicate that no value is returned (void)
  method() {
    return;
  }
}
```

The following patterns are not warnings:

```ts
// No return value should be expected (void)
function test(): void {
  return;
}

// A return value of type number
var fn = function (): number {
  return 1;
};

// A return value of type string
var arrowFn = (): string => 'test';

class Test {
  // No return value should be expected (void)
  method(): void {
    return;
  }
}
```

## Options

The rule accepts an options object with the following properties:

```ts
type Options = {
  // if true, only functions which are part of a declaration will be checked
  allowExpressions?: boolean;
  // if true, type annotations are also allowed on the variable of a function expression rather than on the function directly
  allowTypedFunctionExpressions?: boolean;
  // if true, functions immediately returning another function expression will not be checked
  allowHigherOrderFunctions?: boolean;
  // if true, arrow functions immediately returning a `as const` value will not be checked
  allowDirectConstAssertionInArrowFunctions?: boolean;
  // if true, concise arrow functions that start with the void keyword will not be checked
  allowConciseArrowFunctionExpressionsStartingWithVoid?: boolean;
};

const defaults = {
  allowExpressions: false,
  allowTypedFunctionExpressions: true,
  allowHigherOrderFunctions: true,
  allowDirectConstAssertionInArrowFunctions: true,
  allowConciseArrowFunctionExpressionsStartingWithVoid: false,
};
```

### Configuring in a mixed JS/TS codebase

If you are working on a codebase within which you lint non-TypeScript code (i.e. `.js`/`.jsx`), you should ensure that you should use [ESLint `overrides`](https://eslint.org/docs/user-guide/configuring#disabling-rules-only-for-a-group-of-files) to only enable the rule on `.ts`/`.tsx` files. If you don't, then you will get unfixable lint errors reported within `.js`/`.jsx` files.

```jsonc
{
  "rules": {
    // disable the rule for all files
    "@typescript-eslint/explicit-function-return-type": "off"
  },
  "overrides": [
    {
      // enable the rule specifically for TypeScript files
      "files": ["*.ts", "*.tsx"],
      "rules": {
        "@typescript-eslint/explicit-function-return-type": ["error"]
      }
    }
  ]
}
```

### `allowExpressions`

Examples of **incorrect** code for this rule with `{ allowExpressions: true }`:

```ts
function test() {}

const fn = () => {};

export default () => {};
```

Examples of **correct** code for this rule with `{ allowExpressions: true }`:

```ts
node.addEventListener('click', () => {});

node.addEventListener('click', function () {});

const foo = arr.map(i => i * i);
```

### `allowTypedFunctionExpressions`

Examples of **incorrect** code for this rule with `{ allowTypedFunctionExpressions: true }`:

```ts
let arrowFn = () => 'test';

let funcExpr = function () {
  return 'test';
};

let objectProp = {
  foo: () => 1,
};
```

Examples of additional **correct** code for this rule with `{ allowTypedFunctionExpressions: true }`:

```ts
type FuncType = () => string;

let arrowFn: FuncType = () => 'test';

let funcExpr: FuncType = function() {
  return 'test';
};

let asTyped = (() => '') as () => string;
let castTyped = <() => string>(() => '');

interface ObjectType {
  foo(): number;
}
let objectProp: ObjectType = {
  foo: () => 1,
};
let objectPropAs = {
  foo: () => 1,
} as ObjectType;
let objectPropCast = <ObjectType>{
  foo: () => 1,
};

declare functionWithArg(arg: () => number);
functionWithArg(() => 1);

declare functionWithObjectArg(arg: { method: () => number });
functionWithObjectArg({
  method() {
    return 1;
  },
});
```

### `allowHigherOrderFunctions`

Examples of **incorrect** code for this rule with `{ allowHigherOrderFunctions: true }`:

```ts
var arrowFn = () => () => {};

function fn() {
  return function () {};
}
```

Examples of **correct** code for this rule with `{ allowHigherOrderFunctions: true }`:

```ts
var arrowFn = () => (): void => {};

function fn() {
  return function (): void {};
}
```

### `allowDirectConstAssertionInArrowFunctions`

Examples of **incorrect** code for this rule with `{ allowDirectConstAssertionInArrowFunctions: true }`:

```ts
const func = (value: number) => ({ type: 'X', value } as any);
const func = (value: number) => ({ type: 'X', value } as Action);
```

Examples of **correct** code for this rule with `{ allowDirectConstAssertionInArrowFunctions: true }`:

```ts
const func = (value: number) => ({ foo: 'bar', value } as const);
const func = () => x as const;
```

### `allowConciseArrowFunctionExpressionsStartingWithVoid`

Examples of **incorrect** code for this rule with `{ allowConciseArrowFunctionExpressionsStartingWithVoid: true }`:

```ts
var join = (a: string, b: string) => `${a}${b}`;

const log = (message: string) => {
  console.log(message);
};
```

Examples of **correct** code for this rule with `{ allowConciseArrowFunctionExpressionsStartingWithVoid: true }`:

```ts
var log = (message: string) => void console.log(message);
```

## When Not To Use It

If you don't wish to prevent calling code from using function return values in unexpected ways, then
you will not need this rule.

## Further Reading

- TypeScript [Functions](https://www.typescriptlang.org/docs/handbook/functions.html#function-types)
