# Disallow iterating over an array with a for-in loop (`no-for-in-array`)

This rule prohibits iterating over an array with a for-in loop.

## Rule Details

Rationale from TSLint:

A for-in loop (`for (var k in o)`) iterates over the properties of an Object.
While it is legal to use for-in loops with array types, it is not common.
for-in will iterate over the indices of the array as strings, omitting any "holes" in
the array.
More common is to use for-of, which iterates over the values of an array.
If you want to iterate over the indices, alternatives include:

```js
array.forEach((value, index) => { ... });
for (const [index, value] of array.entries()) { ... }
for (let i = 0; i < array.length; i++) { ... }
```

Examples of **incorrect** code for this rule:

```js
for (const x in [3, 4, 5]) {
  console.log(x);
}
```

Examples of **correct** code for this rule:

```js
for (const x in { a: 3, b: 4, c: 5 }) {
  console.log(x);
}
```

## When Not To Use It

If you want to iterate through a loop using the indices in an array as strings, you can turn off this rule.

## Related to

- TSLint: ['no-for-in-array'](https://palantir.github.io/tslint/rules/no-for-in-array/)
