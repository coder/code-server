# Enforce the use of `String#startsWith` and `String#endsWith` instead of other equivalent methods of checking substrings (`prefer-string-starts-ends-with`)

There are multiple ways to verify if a string starts or ends with a specific string, such as `foo.indexOf('bar') === 0`.

Since ES2015 has added `String#startsWith` and `String#endsWith`, this rule reports other ways to be consistent.

## Rule Details

This rule is aimed at enforcing a consistent way to check whether a string starts or ends with a specific string.

Examples of **incorrect** code for this rule:

```ts
let foo: string;

// starts with
foo[0] === 'b';
foo.charAt(0) === 'b';
foo.indexOf('bar') === 0;
foo.slice(0, 3) === 'bar';
foo.substring(0, 3) === 'bar';
foo.match(/^bar/) != null;
/^bar/.test(foo);

// ends with
foo[foo.length - 1] === 'b';
foo.charAt(foo.length - 1) === 'b';
foo.lastIndexOf('bar') === foo.length - 3;
foo.slice(-3) === 'bar';
foo.substring(foo.length - 3) === 'bar';
foo.match(/bar$/) != null;
/bar$/.test(foo);
```

Examples of **correct** code for this rule:

```ts
foo.startsWith('bar');
foo.endsWith('bar');
```

## Options

There are no options.

```JSON
{
    "@typescript-eslint/prefer-string-starts-ends-with": "error"
}
```

## When Not To Use It

If you don't mind that style, you can turn this rule off safely.
