# Enforce template literal expressions to be of string type (`restrict-template-expressions`)

Examples of **correct** code:

```ts
const arg = 'foo';
const msg1 = `arg = ${arg}`;
const msg2 = `arg = ${arg || 'default'}`;

const stringWithKindProp: string & { _kind?: 'MyString' } = 'foo';
const msg3 = `stringWithKindProp = ${stringWithKindProp}`;
```

Examples of **incorrect** code:

```ts
const arg1 = [1, 2];
const msg1 = `arg1 = ${arg1}`;

const arg2 = { name: 'Foo' };
const msg2 = `arg2 = ${arg2 || null}`;
```

## Options

The rule accepts an options object with the following properties:

```ts
type Options = {
  // if true, also allow number type in template expressions
  allowNumber?: boolean;
  // if true, also allow boolean type in template expressions
  allowBoolean?: boolean;
  // if true, also allow any in template expressions
  allowAny?: boolean;
  // if true, also allow null and undefined in template expressions
  allowNullish?: boolean;
};

const defaults = {
  allowNumber: true,
  allowBoolean: false,
  allowAny: false,
  allowNullish: false,
};
```

### `allowNumber`

Examples of additional **correct** code for this rule with `{ allowNumber: true }`:

```ts
const arg = 123;
const msg1 = `arg = ${arg}`;
const msg2 = `arg = ${arg || 'zero'}`;
```

### `allowBoolean`

Examples of additional **correct** code for this rule with `{ allowBoolean: true }`:

```ts
const arg = true;
const msg1 = `arg = ${arg}`;
const msg2 = `arg = ${arg || 'not truthy'}`;
```

### `allowAny`

Examples of additional **correct** code for this rule with `{ allowAny: true }`:

```ts
const user = JSON.parse('{ "name": "foo" }');
const msg1 = `arg = ${user.name}`;
const msg2 = `arg = ${user.name || 'the user with no name'}`;
```

### `allowNullish`

Examples of additional **correct** code for this rule with `{ allowNullish: true }`:

```ts
const arg = condition ? 'ok' : null;
const msg1 = `arg = ${arg}`;
```
