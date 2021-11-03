# Require a specific member delimiter style for interfaces and type literals (`member-delimiter-style`)

Enforces a consistent member delimiter style in interfaces and type literals. There are three member delimiter styles primarily used in TypeScript:

- Semicolon style (default, preferred in TypeScript).

<!-- prettier-ignore -->
```ts
interface Foo {
    name: string;
    greet(): void;
}

type Bar = {
    name: string;
    greet(): void;
}
```

- Comma style (JSON style).

<!-- prettier-ignore -->
```ts
interface Foo {
    name: string,
    greet(): void,
}

type Bar = {
    name: string,
    greet(): void,
}
```

- Line break (none) style.

<!-- prettier-ignore -->
```ts
interface Foo {
    name: string
    greet(): void
}

type Bar = {
    name: string
    greet(): void
}
```

The rule also enforces the presence (or absence) of the delimiter in the last member of the interface and/or type literal.
Finally, this rule can enforce separate delimiter syntax for single line declarations.

## Rule Details

This rule aims to standardize the way interface and type literal members are delimited.

## Options

```ts
interface BaseConfig {
  multiline?: {
    delimiter?: 'none' | 'semi' | 'comma';
    requireLast?: boolean;
  };
  singleline?: {
    delimiter?: 'semi' | 'comma';
    requireLast?: boolean;
  };
}
type Config = BaseConfig & {
  overrides?: {
    interface?: BaseConfig;
    typeLiteral?: BaseConfig;
  };
  multilineDetection?: 'brackets' | 'last-member';
};
```

Default config:

```JSON
{
    "multiline": {
        "delimiter": "semi",
        "requireLast": true
    },
    "singleline": {
        "delimiter": "semi",
        "requireLast": false
    },
    "multilineDetection": "brackets"
}
```

`multiline` config only applies to multiline `interface`/`type` definitions.
`singleline` config only applies to single line `interface`/`type` definitions.
The two configs are entirely separate, and do not effect one another.

`multilineDetection` determines what counts as multiline

- `"brackets"` (default) any newlines in the type or interface make it multiline.
- `"last-member"` if the last member of the interface is on the same line as the last bracket, it is counted as a single line.

### `delimiter`

Accepts three values (or two for `singleline`):

- `comma` - each member should be delimited with a comma (`,`).
- `semi` - each member should be delimited with a semicolon (`;`).
- `none` - each member should be delimited with nothing.
  - NOTE - this is not an option for `singleline` because having no delimiter between members on a single line is a syntax error in TS.

### `requireLast`

Determines whether or not the last member in the `interface`/`type` should have a delimiter:

- `true` - the last member **_must_** have a delimiter.
- `false` - the last member **_must not_** have a delimiter.

### `overrides`

Allows you to specify options specifically for either `interface`s or `type` definitions / inline `type`s.

For example, to require commas for `type`s, and semicolons for multiline `interface`s:

```JSON
{
    "multiline": {
        "delimiter": "comma",
        "requireLast": true
    },
    "singleline": {
        "delimiter": "comma",
        "requireLast": true
    },
    "overrides": {
        "interface": {
            "multiline": {
                "delimiter": "semi",
                "requireLast": true
            }
        }
    }
}
```

## Examples

Examples of **incorrect** code for this rule with the default config:

<!-- prettier-ignore -->
```ts
// missing semicolon delimiter
interface Foo {
    name: string
    greet(): string
}

// using incorrect delimiter
interface Bar {
    name: string,
    greet(): string,
}

// missing last member delimiter
interface Baz {
    name: string;
    greet(): string
}

// incorrect delimiter
type FooBar = { name: string, greet(): string }

// last member should not have delimiter
type FooBar = { name: string; greet(): string; }
```

Examples of **correct** code for this rule with the default config:

<!-- prettier-ignore -->
```ts
interface Foo {
    name: string;
    greet(): string;
}

interface Foo { name: string }

type Bar = {
    name: string;
    greet(): string;
}

type Bar = { name: string }

type FooBar = { name: string; greet(): string }
```

## When Not To Use It

If you don't care about enforcing a consistent member delimiter in interfaces and type literals, then you will not need this rule.
