# When adding two variables, operands must both be of type number or of type string (`restrict-plus-operands`)

Examples of **correct** code:

```ts
var foo = parseInt('5.5', 10) + 10;
var foo = 1n + 1n;
```

Examples of **incorrect** code:

```ts
var foo = '5.5' + 5;
var foo = 1n + 1;
```

## Options

This rule has an object option:

- `"checkCompoundAssignments": false`: (default) does not check compound assignments (`+=`)
- `"checkCompoundAssignments": true`

### `checkCompoundAssignments`

Examples of **incorrect** code for the `{ "checkCompoundAssignments": true }` option:

```ts
/*eslint @typescript-eslint/restrict-plus-operands: ["error", { "checkCompoundAssignments": true }]*/

let foo: string | undefined;
foo += 'some data';

let bar: string = '';
bar += 0;
```

Examples of **correct** code for the `{ "checkCompoundAssignments": true }` option:

```ts
/*eslint @typescript-eslint/restrict-plus-operands: ["error", { "checkCompoundAssignments": true }]*/

let foo: number = 0;
foo += 1;

let bar = '';
bar += 'test';
```

```json
{
  "@typescript-eslint/restrict-plus-operands": "error"
}
```

## Compatibility

- TSLint: [restrict-plus-operands](https://palantir.github.io/tslint/rules/restrict-plus-operands/)
