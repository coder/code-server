# Prefer a ‘for-of’ loop over a standard ‘for’ loop if the index is only used to access the array being iterated (`prefer-for-of`)

This rule recommends a for-of loop when the loop index is only used to read from an array that is being iterated.

## Rule Details

For cases where the index is only used to read from the array being iterated, a for-of loop is easier to read and write.

Examples of **incorrect** code for this rule:

```js
for (let i = 0; i < arr.length; i++) {
  console.log(arr[i]);
}
```

Examples of **correct** code for this rule:

```js
for (const x of arr) {
  console.log(x);
}

for (let i = 0; i < arr.length; i++) {
  // i is used to write to arr, so for-of could not be used.
  arr[i] = 0;
}

for (let i = 0; i < arr.length; i++) {
  // i is used independent of arr, so for-of could not be used.
  console.log(i, arr[i]);
}
```

## When Not To Use It

If you transpile for browsers that do not support for-of loops, you may wish to use traditional for loops that produce more compact code.

## Related to

- TSLint: ['prefer-for-of'](https://palantir.github.io/tslint/rules/prefer-for-of/)
