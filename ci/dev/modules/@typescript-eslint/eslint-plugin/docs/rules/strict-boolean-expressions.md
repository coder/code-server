# Restricts the types allowed in boolean expressions (`strict-boolean-expressions`)

Forbids usage of non-boolean types in expressions where a boolean is expected.
`boolean` and `never` types are always allowed.
Additional types which are considered safe in a boolean context can be configured via options.

The following nodes are considered boolean expressions and their type is checked:

- Argument to the logical negation operator (`!arg`).
- The condition in a conditional expression (`cond ? x : y`).
- Conditions for `if`, `for`, `while`, and `do-while` statements.
- Operands of logical binary operators (`lhs || rhs` and `lhs && rhs`).
  - Right-hand side operand is ignored when it's not a descendant of another boolean expression.
    This is to allow usage of boolean operators for their short-circuiting behavior.

## Examples

Examples of **incorrect** code for this rule:

```ts
// nullable numbers are considered unsafe by default
let num: number | undefined = 0;
if (num) {
  console.log('num is defined');
}

// nullable strings are considered unsafe by default
let str: string | null = null;
if (!str) {
  console.log('str is empty');
}

// nullable booleans are considered unsafe by default
function foo(bool?: boolean) {
  if (bool) {
    bar();
  }
}

// `any`, unconstrained generics and unions of more than one primitive type are disallowed
const foo = <T>(arg: T) => (arg ? 1 : 0);

// always-truthy and always-falsy types are disallowed
let obj = {};
while (obj) {
  obj = getObj();
}
```

Examples of **correct** code for this rule:

```tsx
// Using logical operator short-circuiting is allowed
const Component = () => {
  const entry = map.get('foo') || {};
  return entry && <p>Name: {entry.name}</p>;
};

// nullable values should be checked explicitly against null or undefined
let num: number | undefined = 0;
if (num != null) {
  console.log('num is defined');
}

let str: string | null = null;
if (str != null && !str) {
  console.log('str is empty');
}

function foo(bool?: boolean) {
  if (bool ?? false) {
    bar();
  }
}

// `any` types should be cast to boolean explicitly
const foo = (arg: any) => (Boolean(arg) ? 1 : 0);
```

## Options

```ts
type Options = {
  allowString?: boolean;
  allowNumber?: boolean;
  allowNullableObject?: boolean;
  allowNullableBoolean?: boolean;
  allowNullableString?: boolean;
  allowNullableNumber?: boolean;
  allowAny?: boolean;
};

const defaultOptions: Options = {
  allowString: true,
  allowNumber: true,
  allowNullableObject: true,
  allowNullableBoolean: false,
  allowNullableString: false,
  allowNullableNumber: false,
  allowAny: false,
  allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
};
```

### `allowString`

Allows `string` in a boolean context.
This is safe because strings have only one falsy value (`""`).
Set this to `false` if you prefer the explicit `str != ""` or `str.length > 0` style.

### `allowNumber`

Allows `number` in a boolean context.
This is safe because numbers have only two falsy values (`0` and `NaN`).
Set this to `false` if you prefer the explicit `num != 0` and `!Number.isNaN(num)` style.

### `allowNullableObject`

Allows `object | function | symbol | null | undefined` in a boolean context.
This is safe because objects, functions and symbols don't have falsy values.
Set this to `false` if you prefer the explicit `obj != null` style.

### `allowNullableBoolean`

Allows `boolean | null | undefined` in a boolean context.
This is unsafe because nullable booleans can be either `false` or nullish.
Set this to `false` if you want to enforce explicit `bool ?? false` or `bool ?? true` style.
Set this to `true` if you don't mind implicitly treating false the same as a nullish value.

### `allowNullableString`

Allows `string | null | undefined` in a boolean context.
This is unsafe because nullable strings can be either an empty string or nullish.
Set this to `true` if you don't mind implicitly treating an empty string the same as a nullish value.

### `allowNullableNumber`

Allows `number | null | undefined` in a boolean context.
This is unsafe because nullable numbers can be either a falsy number or nullish.
Set this to `true` if you don't mind implicitly treating zero or NaN the same as a nullish value.

### `allowAny`

Allows `any` in a boolean context.
This is unsafe for obvious reasons.
Set this to `true` at your own risk.

### `allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing`

If this is set to `false`, then the rule will error on every file whose `tsconfig.json` does _not_ have the `strictNullChecks` compiler option (or `strict`) set to `true`.

Without `strictNullChecks`, TypeScript essentially erases `undefined` and `null` from the types. This means when this rule inspects the types from a variable, **it will not be able to tell that the variable might be `null` or `undefined`**, which essentially makes this rule a lot less useful.

You should be using `strictNullChecks` to ensure complete type-safety in your codebase.

If for some reason you cannot turn on `strictNullChecks`, but still want to use this rule - you can use this option to allow it - but know that the behavior of this rule is _undefined_ with the compiler option turned off. We will not accept bug reports if you are using this option.

## Fixes and suggestions

This rule provides following fixes and suggestions for particular types in boolean context:

- `boolean` - Always allowed - no fix needed.
- `string` - (when `allowString` is `false`) - Provides following suggestions:
  - Change condition to check string's length (`str` → `str.length > 0`)
  - Change condition to check for empty string (`str` → `str !== ""`)
  - Explicitly cast value to a boolean (`str` → `Boolean(str)`)
- `number` - (when `allowNumber` is `false`):
  - For `array.length` - Provides **autofix**:
    - Change condition to check for 0 (`array.length` → `array.length > 0`)
  - For other number values - Provides following suggestions:
    - Change condition to check for 0 (`num` → `num !== 0`)
    - Change condition to check for NaN (`num` → `!Number.isNaN(num)`)
    - Explicitly cast value to a boolean (`num` → `Boolean(num)`)
- `object | null | undefined` - (when `allowNullableObject` is `false`) - Provides **autofix**:
  - Change condition to check for null/undefined (`maybeObj` → `maybeObj != null`)
- `boolean | null | undefined` - Provides following suggestions:
  - Explicitly treat nullish value the same as false (`maybeBool` → `maybeBool ?? false`)
  - Change condition to check for true/false (`maybeBool` → `maybeBool === true`)
- `string | null | undefined` - Provides following suggestions:
  - Change condition to check for null/undefined (`maybeStr` → `maybeStr != null`)
  - Explicitly treat nullish value the same as an empty string (`maybeStr` → `maybeStr ?? ""`)
  - Explicitly cast value to a boolean (`maybeStr` → `Boolean(maybeStr)`)
- `number | null | undefined` - Provides following suggestions:
  - Change condition to check for null/undefined (`maybeNum` → `maybeNum != null`)
  - Explicitly treat nullish value the same as 0 (`maybeNum` → `maybeNum ?? 0`)
  - Explicitly cast value to a boolean (`maybeNum` → `Boolean(maybeNum)`)
- `any` and `unknown` - Provides following suggestions:
  - Explicitly cast value to a boolean (`value` → `Boolean(value)`)

## Related To

- TSLint: [strict-boolean-expressions](https://palantir.github.io/tslint/rules/strict-boolean-expressions)

- [no-unnecessary-condition](./no-unnecessary-condition.md) - Similar rule which reports always-truthy and always-falsy values in conditions
