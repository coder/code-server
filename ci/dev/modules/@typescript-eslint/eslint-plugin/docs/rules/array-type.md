# Requires using either `T[]` or `Array<T>` for arrays (`array-type`)

Using the same style for array definitions across your codebase makes it easier for your developers to read and understand the types.

## Rule Details

This rule aims to standardize usage of array types within your codebase.

## Options

```ts
type ArrayOption = 'array' | 'generic' | 'array-simple';
type Options = {
  default: ArrayOption;
  readonly?: ArrayOption;
};

const defaultOptions: Options = {
  default: 'array',
};
```

The rule accepts an options object with the following properties:

- `default` - sets the array type expected for mutable cases.
- `readonly` - sets the array type expected for readonly arrays. If this is omitted, then the value for `default` will be used.

Each property can be set to one of three strings: `'array' | 'generic' | 'array-simple'`.

The default config will enforce that all mutable and readonly arrays use the `'array'` syntax.

### `"array"`

Always use `T[]` or `readonly T[]` for all array types.

Incorrect code for `"array"`:

```ts
const x: Array<string> = ['a', 'b'];
const y: ReadonlyArray<string> = ['a', 'b'];
```

Correct code for `"array"`:

```ts
const x: string[] = ['a', 'b'];
const y: readonly string[] = ['a', 'b'];
```

### `"generic"`

Always use `Array<T>` or `ReadonlyArray<T>` for all array types.

Incorrect code for `"generic"`:

```ts
const x: string[] = ['a', 'b'];
const y: readonly string[] = ['a', 'b'];
```

Correct code for `"generic"`:

```ts
const x: Array<string> = ['a', 'b'];
const y: ReadonlyArray<string> = ['a', 'b'];
```

### `"array-simple"`

Use `T[]` or `readonly T[]` for simple types (i.e. types which are just primitive names or type references).
Use `Array<T>` or `ReadonlyArray<T>` for all other types (union types, intersection types, object types, function types, etc).

Incorrect code for `"array-simple"`:

```ts
const a: (string | number)[] = ['a', 'b'];
const b: { prop: string }[] = [{ prop: 'a' }];
const c: (() => void)[] = [() => {}];
const d: Array<MyType> = ['a', 'b'];
const e: Array<string> = ['a', 'b'];
const f: ReadonlyArray<string> = ['a', 'b'];
```

Correct code for `"array-simple"`:

```ts
const a: Array<string | number> = ['a', 'b'];
const b: Array<{ prop: string }> = [{ prop: 'a' }];
const c: Array<() => void> = [() => {}];
const d: MyType[] = ['a', 'b'];
const e: string[] = ['a', 'b'];
const f: readonly string[] = ['a', 'b'];
```

## Combination matrix

This matrix lists all possible option combinations and their expected results for different types of Arrays.

| defaultOption  | readonlyOption | Array with simple type | Array with non simple type | Readonly array with simple type | Readonly array with non simple type |
| -------------- | -------------- | ---------------------- | -------------------------- | ------------------------------- | ----------------------------------- |
| `array`        |                | `number[]`             | `(Foo & Bar)[]`            | `readonly number[]`             | `readonly (Foo & Bar)[]`            |
| `array`        | `array`        | `number[]`             | `(Foo & Bar)[]`            | `readonly number[]`             | `readonly (Foo & Bar)[]`            |
| `array`        | `array-simple` | `number[]`             | `(Foo & Bar)[]`            | `readonly number[]`             | `ReadonlyArray<Foo & Bar>`          |
| `array`        | `generic`      | `number[]`             | `(Foo & Bar)[]`            | `ReadonlyArray<number>`         | `ReadonlyArray<Foo & Bar>`          |
| `array-simple` |                | `number[]`             | `Array<Foo & Bar>`         | `readonly number[]`             | `ReadonlyArray<Foo & Bar>`          |
| `array-simple` | `array`        | `number[]`             | `Array<Foo & Bar>`         | `readonly number[]`             | `readonly (Foo & Bar)[]`            |
| `array-simple` | `array-simple` | `number[]`             | `Array<Foo & Bar>`         | `readonly number[]`             | `ReadonlyArray<Foo & Bar>`          |
| `array-simple` | `generic`      | `number[]`             | `Array<Foo & Bar>`         | `ReadonlyArray<number>`         | `ReadonlyArray<Foo & Bar>`          |
| `generic`      |                | `Array<number>`        | `Array<Foo & Bar>`         | `ReadonlyArray<number>`         | `ReadonlyArray<Foo & Bar>`          |
| `generic`      | `array`        | `Array<number>`        | `Array<Foo & Bar>`         | `readonly number[]`             | `readonly (Foo & Bar)[]`            |
| `generic`      | `array-simple` | `Array<number>`        | `Array<Foo & Bar>`         | `readonly number[]`             | `ReadonlyArray<Foo & Bar>`          |
| `generic`      | `generic`      | `Array<number>`        | `Array<Foo & Bar>`         | `ReadonlyArray<number>`         | `ReadonlyArray<Foo & Bar>`          |

## Related to

- TSLint: [array-type](https://palantir.github.io/tslint/rules/array-type/)
