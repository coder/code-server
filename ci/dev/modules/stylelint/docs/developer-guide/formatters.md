# Writing formatters

A formatter is a function with the following signature:

```js
/**
 * @type {import('stylelint').Formatter}
 */
function formatter(results, returnValue) {
  return "a string of formatted results";
}
```

Where the first argument (`results`) is an array of stylelint result objects (type `Array<StylelintResult>`) in the form:

```js
// A stylelint result object
{
  "source": "path/to/file.css", // The filepath or PostCSS identifier like <input css 1>
  "errored": true, // This is `true` if at least one rule with an "error"-level severity triggered a warning
  "warnings": [
    // Array of rule violation warning objects, each like the following ...
    {
      "line": 3,
      "column": 12,
      "rule": "block-no-empty",
      "severity": "error",
      "text": "You should not have an empty block (block-no-empty)"
    }
  ],
  "deprecations": [
    // Array of deprecation warning objects, each like the following ...
    {
      "text": "Feature X has been deprecated and will be removed in the next major version.",
      "reference": "https://stylelint.io/docs/feature-x.md"
    }
  ],
  "invalidOptionWarnings": [
    // Array of invalid option warning objects, each like the following ...
    {
      "text": "Invalid option X for rule Y"
    }
  ],
  "ignored": false // This is `true` if the file's path matches a provided ignore pattern
}
```

And the second argument (`returnValue`) is an object (type `StylelintStandaloneReturnValue`) with one or more of the following keys:

```js
{
  "errored": false, // `true` if there were any warnings with "error" severity
  "maxWarningsExceeded": {
    // Present if stylelint was configured with a `maxWarnings` count
    "maxWarnings": 10,
    "foundWarnings": 15
  }
}
```

## Passing arguments

You can use environmental variables in your formatter. For example, pass `SKIP_WARNINGS`:

```console
SKIP_WARNINGS=true stylelint "*.css" --custom-formatter ./my-formatter.js
```

Alternatively, you can create a separate formatting program and pipe the output from the built-in JSON formatter into it:

```console
stylelint -f json "*.css" | my-program-that-reads-JSON --option
```

## `stylelint.formatters`

stylelint's internal formatters are exposed publicly in `stylelint.formatters`.
