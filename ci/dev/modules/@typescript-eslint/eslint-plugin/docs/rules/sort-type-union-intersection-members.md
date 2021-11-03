# Enforces that members of a type union/intersection are sorted alphabetically (`sort-type-union-intersection-members`)

Sorting union (`|`) and intersection (`&`) types can help:

- keep your codebase standardized
- find repeated types
- reduce diff churn

## Rule Details

Sorting within each group is done using the following code:

```ts
const collator = new Intl.Collator('en', {
  sensitivity: 'base',
  numeric: true,
});

function compare(a, b) {
  return collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);
}
```

In other words, the types are sorted alphabetically, case-insensitively and treating numbers like a human would, falling back to character code sorting in case of ties.

Examples of **incorrect** code for this rule:

```ts
type T1 = B | A;

type T2 = { b: string } & { a: string };

type T3 = [1, 2, 4] & [1, 2, 3];

type T4 =
  | [1, 2, 4]
  | [1, 2, 3]
  | { b: string }
  | { a: string }
  | (() => void)
  | (() => string)
  | 'b'
  | 'a'
  | 'b'
  | 'a'
  | readonly string[]
  | readonly number[]
  | string[]
  | number[]
  | B
  | A
  | string
  | any;
```

Examples of **correct** code for this rule:

```ts
type T1 = A | B;

type T2 = { a: string } & { b: string };

type T3 = [1, 2, 3] & [1, 2, 4];

type T4 =
  | any
  | string
  | A
  | B
  | number[]
  | string[]
  | readonly number[]
  | readonly string[]
  | 'a'
  | 'b'
  | 'a'
  | 'b'
  | (() => string)
  | (() => void)
  | { a: string }
  | { b: string }
  | [1, 2, 3]
  | [1, 2, 4];
```

## Options

```ts
type Options = {
  // true to check intersection types, false otherwise
  checkIntersections?: boolean;
  // true to check union types, false otherwise
  checkUnions?: boolean;
  // the ordering of the groups
  groupOrder?: (
    | 'conditional'
    | 'function'
    | 'import'
    | 'intersection'
    | 'keyword'
    | 'literal'
    | 'named'
    | 'object'
    | 'operator'
    | 'tuple'
    | 'union'
    | 'nullish'
  )[];
};

const defaultOptions: Options = {
  checkIntersections: true,
  checkUnions: true,
  groupOrder: [
    'named',
    'keyword',
    'operator',
    'literal',
    'function',
    'import',
    'conditional',
    'object',
    'tuple',
    'intersection',
    'union',
    'nullish',
  ],
};
```

### `groupOrder`

Each member of the type is placed into a group, and then the rule sorts alphabetically within each group.
The ordering of groups is determined by this option.

- `conditional` - Conditional types (`A extends B ? C : D`)
- `function` - Function and constructor types (`() => void`, `new () => type`)
- `import` - Import types (`import('path')`)
- `intersection` - Intersection types (`A & B`)
- `keyword` - Keyword types (`any`, `string`, etc)
- `literal` - Literal types (`1`, `'b'`, `true`, etc)
- `named` - Named types (`A`, `A['prop']`, `B[]`, `Array<C>`)
- `object` - Object types (`{ a: string }`, `{ [key: string]: number }`)
- `operator` - Operator types (`keyof A`, `typeof B`, `readonly C[]`)
- `tuple` - Tuple types (`[A, B, C]`)
- `union` - Union types (`A | B`)
- `nullish` - `null` and `undefined`
