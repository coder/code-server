# prettier-linter-helpers

Helper functions for exposing prettier changes within linting tools.

This package contains:

- `showInvisibles(string)` - Replace invisible characters with ones you can see for
  for easier diffing.
- `generateDifferences(source, prettierSource)` - Generate an array of
  differences between two strings.

## Inspiration

This code was extracted from [eslint-plugin-prettier v2.7.0](https://github.com/prettier/eslint-plugin-prettier/blob/v2.7.0/eslint-plugin-prettier.js#L85-L215)
