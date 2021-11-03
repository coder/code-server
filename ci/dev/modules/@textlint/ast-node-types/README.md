# @textlint/ast-node-types

The definition for textlint AST Node types.

This module for parse plugin.


For more details, see [TxtNode document](https://github.com/textlint/textlint/blob/master/docs/txtnode.md).

## Installation

    npm install @textlint/ast-node-types

## Usage

```js
import { ASTNodeTypes } from "@textlint/ast-node-types";
console.log(ASTNodeTypes.Document); // => string
```

### Type interface for TxtNode

This library include type interface of [TxtNode](https://github.com/textlint/textlint/blob/master/docs/txtnode.md).
TypeScript user can use it as type of TxtNode.

```ts
// type interface
import { TxtNode } from "@textlint/ast-node-types";

```


## For parser creator

Please use it for creating your textlint-plugin parser.

Use it by

- textlint internal
- `@textlint/text-to-ast`
- `@textlint/markdown-to-ast`

## Versioning

- major: Breaking Change
- minor: Adding new type
- patch: Fixing issues

## Tests

    npm test

## Contributing

If you want to new type for AST, Please file issue :)

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT
