# Options

Options shared by the:

- [CLI](cli.md)
- [Node.js API](node-api.md)
- [PostCSS plugin](postcss-plugin.md)

## `configFile`

CLI flag: `--config`

Path to a JSON, YAML, or JS file that contains your [configuration object](../configure.md).

Use this option if you don't want stylelint to search for a configuration file.

The path should be either absolute or relative to the directory that your process is running from (`process.cwd()`).

## `configBasedir`

CLI flag: `--config-basedir`

Absolute path to the directory that relative paths defining "extends" and "plugins" are _relative to_. Only necessary if these values are relative paths.

## `fix`

CLI flag: `--fix`

Automatically fix, where possible, violations reported by rules.

For CSS with standard syntax, stylelint uses [postcss-safe-parser](https://github.com/postcss/postcss-safe-parser) to fix syntax errors.

If a source contains a:

- scoped disable comment, e.g. `/* stylelint-disable indentation */`, any violations reported by the scoped rules will not be automatically fixed anywhere in the source
- unscoped disable comment, i.e. `/* stylelint-disable */`, the entirety of source will not be automatically fixed

This limitation in being tracked in [issue #2643](https://github.com/stylelint/stylelint/issues/2643).

## `formatter`

CLI flags: `--formatter, -f` | `--custom-formatter`

Specify the formatter to format your results.

Options are:

- `compact`
- `json` (default for Node API)
- `string` (default for CLI)
- `tap`
- `unix`
- `verbose`

The `formatter` Node.js API option can also accept a function, whereas the `--custom-formatter` CLI flag accepts a path to a JS file exporting one. The function in both cases must fit the signature described in the [Developer Guide](../../developer-guide/formatters.md).

## `cache`

CLI flag: `--cache`

Store the results of processed files so that stylelint only operates on the changed ones. By default, the cache is stored in `./.stylelintcache` in `process.cwd()`.

Enabling this option can dramatically improve stylelint's speed because only changed files are linted.

_If you run stylelint with `cache` and then run stylelint without `cache`, stylelint deletes the `.stylelintcache` because we have to assume that that second command invalidated `.stylelintcache`._

## `cacheLocation`

CLI flag: `--cache-location`

Path to a file or directory for the cache location.

If a directory is specified, stylelint creates a cache file inside the specified folder. The name of the file is based on the hash of `process.cwd()` (e.g. `.cache_hashOfCWD`) so that stylelint can reuse a single location for a variety of caches from different projects.

_If the directory of `cacheLocation` does not exist, make sure you add a trailing `/` on \*nix systems or `\` on Windows. Otherwise, stylelint assumes the path to be a file._

## `maxWarnings`

CLI flags: `--max-warnings, --mw`

Set a limit to the number of warnings accepted.

It is useful when setting [`defaultSeverity`](../configure.md#defaultseverity) to `"warning"` and expecting the process to fail on warnings (e.g. CI build).

If the number of warnings exceeds this value, the:

- CLI process exits with code `2`
- Node.js API adds a [`maxWarningsExceeded`](node-api.md#maxwarningsexceeded) property to the returned data

## `syntax`

CLI flags: `--syntax, -s`

Specify a syntax. Options:

- `css`
- `css-in-js`
- `html`
- `less`
- `markdown`
- `sass`
- `scss`
- `sugarss`

If you do not specify a syntax, stylelint will automatically infer the syntaxes.

Only use this option if you want to force a specific syntax.

## `customSyntax`

CLI flag: `--custom-syntax`

Specify a custom syntax to use on your code. Use this option if you want to force a specific syntax that's not already built into stylelint.

This option should be a string that resolves to a JS module that exports a [PostCSS-compatible syntax](https://github.com/postcss/postcss#syntaxes). The string can be a module name (like `my-module`) or a path to a JS file (like `path/to/my-module.js`).

Using the Node.js API, the `customSyntax` option can also accept a [Syntax object](https://github.com/postcss/postcss/blob/abfaa7122a0f480bc5be0905df3c24a6a51a82d9/lib/postcss.d.ts#L223-L232). Stylelint treats the `parse` property as a required value.

Note that stylelint can provide no guarantee that core rules work with syntaxes other than the defaults listed for the `syntax` option above.

## `disableDefaultIgnores`

CLI flags: `--disable-default-ignores, --di`

Disable the default ignores. stylelint will not automatically ignore the contents of `node_modules`.

## `ignorePath`

CLI flags: `--ignore-path, -i`

A path to a file containing patterns describing files to ignore. The path can be absolute or relative to `process.cwd()`. By default, stylelint looks for `.stylelintignore` in `process.cwd()`.

## `ignoreDisables`

CLI flags: `--ignore-disables, --id`

Ignore `styleline-disable` (e.g. `/* stylelint-disable block-no-empty */`) comments.

You can use this option to see what your linting results would be like without those exceptions.

## `reportNeedlessDisables`

CLI flags: `--report-needless-disables, --rd`

Produce a report to clean up your codebase, keeping only the `stylelint-disable` comments that serve a purpose.

If needless disables are found, the:

- CLI process exits with code `2`
- Node.js API adds errors to the returned data

## `reportInvalidScopeDisables`

CLI flags: `--report-invalid-scope-disables, --risd`

Produce a report of the `stylelint-disable` comments that used for rules that don't exist within the configuration object.

If invalid scope disables are found, the:

- CLI process exits with code `2`
- Node.js API adds errors to the returned data

## `reportDescriptionlessDisables`

CLI flags: `--report-descriptionless-disables, --rdd`

Produce a report of the `stylelint-disable` comments without a description.

For example, when the configuration `{ block-no-empty: true }` is given, the following patterns are reported:

<!-- prettier-ignore -->
```css
/* stylelint-disable */
a {}
```

<!-- prettier-ignore -->
```css
/* stylelint-disable-next-line block-no-empty */
a {}
```

But, the following patterns (`stylelint-disable -- <description>`) are _not_ reported:

<!-- prettier-ignore -->
```css
/* stylelint-disable -- This violation is ignorable. */
a {}
```

<!-- prettier-ignore -->
```css
/* stylelint-disable-next-line block-no-empty -- This violation is ignorable. */
a {}
```

If descriptionless disables are found, the:

- CLI process exits with code `2`
- Node.js API adds errors to the returned data

## `codeFilename`

CLI flag: `--stdin-filename`

A filename to assign the input.

If using `code` or `stdin` to pass a source string directly, you can use `codeFilename` to associate that code with a particular filename.
