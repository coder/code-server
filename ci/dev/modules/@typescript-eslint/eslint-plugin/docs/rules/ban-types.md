# Bans specific types from being used (`ban-types`)

Some builtin types have aliases, some types are considered dangerous or harmful.
It's often a good idea to ban certain types to help with consistency and safety.

## Rule Details

This rule bans specific types and can suggest alternatives.
Note that it does not ban the corresponding runtime objects from being used.

## Options

```ts
type Options = {
  types?: {
    [typeName: string]:
      | false
      | string
      | {
          message: string;
          fixWith?: string;
        };
  };
  extendDefaults?: boolean;
};
```

The rule accepts a single object as options, with the following keys:

- `types` - An object whose keys are the types you want to ban, and the values are error messages.
  - The type can either be a type name literal (`Foo`), a type name with generic parameter instantiation(s) (`Foo<Bar>`), the empty object literal (`{}`), or the empty tuple type (`[]`).
  - The values can be a string, which is the error message to be reported, `false` to specifically disable this type
    or it can be an object with the following properties:
    - `message: string` - the message to display when the type is matched.
    - `fixWith?: string` - a string to replace the banned type with when the fixer is run. If this is omitted, no fix will be done.
- `extendDefaults` - if you're specifying custom `types`, you can set this to `true` to extend the default `types` configuration.
  - This is a convenience option to save you copying across the defaults when adding another type.
  - If this is `false`, the rule will _only_ use the types defined in your configuration.

Example configuration:

```jsonc
{
  "@typescript-eslint/ban-types": [
    "error",
    {
      "types": {
        // add a custom message to help explain why not to use it
        "Foo": "Don't use Foo because it is unsafe",

        // add a custom message, AND tell the plugin how to fix it
        "String": {
          "message": "Use string instead",
          "fixWith": "string"
        },

        "{}": {
          "message": "Use object instead",
          "fixWith": "object"
        }
      }
    }
  ]
}
```

### Default Options

The default options provide a set of "best practices", intended to provide safety and standardization in your codebase:

- Don't use the upper-case primitive types, you should use the lower-case types for consistency.
- Avoid the `Function` type, as it provides little safety for the following reasons:
  - It provides no type safety when calling the value, which means it's easy to provide the wrong arguments.
  - It accepts class declarations, which will fail when called, as they are called without the `new` keyword.
- Avoid the `Object` and `{}` types, as they mean "any non-nullish value".
  - This is a point of confusion for many developers, who think it means "any object type".
  - See [this comment for more information](https://github.com/typescript-eslint/typescript-eslint/issues/2063#issuecomment-675156492).
- Avoid the `object` type, as it is currently hard to use due to not being able to assert that keys exist.
  - See [microsoft/TypeScript#21732](https://github.com/microsoft/TypeScript/issues/21732).

**_Important note:_** the default options suggest using `Record<string, unknown>`; this was a stylistic decision, as the built-in `Record` type is considered to look cleaner.

<details>
<summary>Default Options</summary>

```ts
const defaultTypes = {
  String: {
    message: 'Use string instead',
    fixWith: 'string',
  },
  Boolean: {
    message: 'Use boolean instead',
    fixWith: 'boolean',
  },
  Number: {
    message: 'Use number instead',
    fixWith: 'number',
  },
  Symbol: {
    message: 'Use symbol instead',
    fixWith: 'symbol',
  },

  Function: {
    message: [
      'The `Function` type accepts any function-like value.',
      'It provides no type safety when calling the function, which can be a common source of bugs.',
      'It also accepts things like class declarations, which will throw at runtime as they will not be called with `new`.',
      'If you are expecting the function to accept certain arguments, you should explicitly define the function shape.',
    ].join('\n'),
  },

  // object typing
  Object: {
    message: [
      'The `Object` type actually means "any non-nullish value", so it is marginally better than `unknown`.',
      '- If you want a type meaning "any object", you probably want `Record<string, unknown>` instead.',
      '- If you want a type meaning "any value", you probably want `unknown` instead.',
    ].join('\n'),
  },
  '{}': {
    message: [
      '`{}` actually means "any non-nullish value".',
      '- If you want a type meaning "any object", you probably want `Record<string, unknown>` instead.',
      '- If you want a type meaning "any value", you probably want `unknown` instead.',
    ].join('\n'),
  },
  object: {
    message: [
      'The `object` type is currently hard to use ([see this issue](https://github.com/microsoft/TypeScript/issues/21732)).',
      'Consider using `Record<string, unknown>` instead, as it allows you to more easily inspect and use the keys.',
    ].join('\n'),
  },
};
```

</details>

### Examples

Examples of **incorrect** code with the default options:

```ts
// use lower-case primitives for consistency
const str: String = 'foo';
const bool: Boolean = true;
const num: Number = 1;
const symb: Symbol = Symbol('foo');

// use a proper function type
const func: Function = () => 1;

// use safer object types
const lowerObj: object = {};

const capitalObj1: Object = 1;
const capitalObj2: Object = { a: 'string' };

const curly1: {} = 1;
const curly2: {} = { a: 'string' };
```

Examples of **correct** code with the default options:

```ts
// use lower-case primitives for consistency
const str: string = 'foo';
const bool: boolean = true;
const num: number = 1;
const symb: symbol = Symbol('foo');

// use a proper function type
const func: () => number = () => 1;

// use safer object types
const lowerObj: Record<string, unknown> = {};

const capitalObj1: number = 1;
const capitalObj2: { a: string } = { a: 'string' };

const curly1: number = 1;
const curly2: Record<'a', string> = { a: 'string' };
```

## Compatibility

- TSLint: [ban-types](https://palantir.github.io/tslint/rules/ban-types/)
