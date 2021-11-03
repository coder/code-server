# Requires `Array#sort` calls to always provide a `compareFunction` (`require-array-sort-compare`)

This rule prevents invoking the `Array#sort()` method without providing a `compare` argument.

When called without a compare function, `Array#sort()` converts all non-undefined array elements into strings and then compares said strings based off their UTF-16 code units.

The result is that elements are sorted alphabetically, regardless of their type.
When sorting numbers, this results in the classic "10 before 2" order:

```ts
[1, 2, 3, 10, 20, 30].sort(); //→ [1, 10, 2, 20, 3, 30]
```

This also means that `Array#sort` does not always sort consistently, as elements may have custom `#toString` implementations that are not deterministic; this trap is noted in the noted in the language specification thusly:

> NOTE 2: Method calls performed by the `ToString` abstract operations in steps 5 and 7 have the potential to cause `SortCompare` to not behave as a consistent comparison function.<br> > https://www.ecma-international.org/ecma-262/9.0/#sec-sortcompare

## Rule Details

This rule aims to ensure all calls of the native `Array#sort` method provide a `compareFunction`, while ignoring calls to user-defined `sort` methods.

Examples of **incorrect** code for this rule:

```ts
const array: any[];
const stringArray: string[];

array.sort();

// String arrays should be sorted using `String#localeCompare`.
stringArray.sort();
```

Examples of **correct** code for this rule:

```ts
const array: any[];
const userDefinedType: { sort(): void };

array.sort((a, b) => a - b);
array.sort((a, b) => a.localeCompare(b));

userDefinedType.sort();
```

## Options

The rule accepts an options object with the following properties:

```ts
type Options = {
  /**
   * If true, an array which all elements are string is ignored.
   */
  ignoreStringArrays?: boolean;
};

const defaults = {
  ignoreStringArrays: false,
};
```

### `ignoreStringArrays`

Examples of **incorrect** code for this rule with `{ ignoreStringArrays: true }`:

```ts
const one = 1;
const two = 2;
const three = 3;
[one, two, three].sort();
```

Examples of **correct** code for this rule with `{ ignoreStringArrays: true }`:

```ts
const one = '1';
const two = '2';
const three = '3';
[one, two, three].sort();
```

## When Not To Use It

If you understand the language specification enough, you can turn this rule off safely.
