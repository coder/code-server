# linebreaks

Specify unix or windows linebreaks.

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"unix"|"windows"`

### `"unix"`

Linebreaks _must always_ be LF (`\n`).

Lines with CRLF linebreaks are considered violations.

### `"windows"`

Linebreaks _must always_ be CRLF (`\r\n`).

Lines with LF linebreaks are considered violations.
