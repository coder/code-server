# Enforce `includes` method over `indexOf` method (`prefer-includes`)

Until ES5, we were using `String#indexOf` method to check whether a string contains an arbitrary substring or not.
Until ES2015, we were using `Array#indexOf` method to check whether an array contains an arbitrary value or not.

ES2015 has added `String#includes` and ES2016 has added `Array#includes`.
It makes code more understandable if we use those `includes` methods for the purpose.

## Rule Details

This rule is aimed at suggesting `includes` method if `indexOf` method was used to check whether an object contains an arbitrary value or not.

If the receiver object of the `indexOf` method call has `includes` method and the two methods have the same parameters, this rule does suggestion.
There are such types: `String`, `Array`, `ReadonlyArray`, and typed arrays.

Additionally, this rule reports the tests of simple regular expressions in favor of `String#includes`.

Examples of **incorrect** code for this rule:

```ts
let str: string;
let array: any[];
let readonlyArray: ReadonlyArray<any>;
let typedArray: UInt8Array;
let maybe: string;
let userDefined: {
  indexOf(x: any): number;
  includes(x: any): boolean;
};

str.indexOf(value) !== -1;
array.indexOf(value) !== -1;
readonlyArray.indexOf(value) === -1;
typedArray.indexOf(value) > -1;
maybe?.indexOf('') !== -1;
userDefined.indexOf(value) >= 0;

// simple RegExp test
/foo/.test(str);
```

Examples of **correct** code for this rule:

```ts
let array: any[];
let readonlyArray: ReadonlyArray<any>;
let typedArray: UInt8Array;
let userDefined: {
  indexOf(x: any): number;
  includes(x: any): boolean;
};
let mismatchExample: {
  indexOf(x: any, fromIndex?: number): number;
  includes(x: any): boolean;
};

str.includes(value);
array.includes(value);
readonlyArray.includes(value);
typedArray.includes(value);
userDefined.includes(value);

// the two methods have different parameters.
mismatchExample.indexOf(value) >= 0;
```

## Options

There are no options.

## When Not To Use It

If you don't want to suggest `includes`, you can safely turn this rule off.
