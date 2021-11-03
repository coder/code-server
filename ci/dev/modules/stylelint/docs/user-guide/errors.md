# Errors & warnings

In addition to rule violations, stylelint surfaces the following errors and warnings:

## CSS syntax error

The chosen [PostCSS syntax](../about/syntaxes.md) was unable to parse the source.

## Parse error

The chosen [PostCSS syntax](../about/syntaxes.md) successfully parsed, but one of the construct-specific parsers failed to parse either a media query, selector or value within that source.

The construct-specific parsers are:

- `postcss-media-query-parser`
- `postcss-selector-parser`
- `postcss-value-parser`

## Unknown rule error

There is an unknown rule in the [configuration object](configure.md).

## Deprecation warning

There is a deprecated rule in the [configuration object](configure.md).

## Invalid option warning

There is a misconfigured rule in the [configuration object](configure.md).
