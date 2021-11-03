# Disallows non-null assertions using the `!` postfix operator (`no-non-null-assertion`)

## Rule Details

Using non-null assertions cancels the benefits of the strict null-checking mode.

Examples of **incorrect** code for this rule:

```ts
interface Foo {
  bar?: string;
}

const foo: Foo = getFoo();
const includesBaz: boolean = foo.bar!.includes('baz');
```

Examples of **correct** code for this rule:

```ts
interface Foo {
  bar?: string;
}

const foo: Foo = getFoo();
const includesBaz: boolean = foo.bar?.includes('baz') ?? false;
```

## When Not To Use It

If you don't care about strict null-checking, then you will not need this rule.

## Further Reading

- [`no-non-null-assertion`](https://palantir.github.io/tslint/rules/no-non-null-assertion/) in [TSLint](https://palantir.github.io/tslint/)
