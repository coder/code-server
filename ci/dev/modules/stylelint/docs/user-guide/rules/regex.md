# Using regex in rules

The following classes of rules support regex:

- `*-allowed-list`
- `*-disallowed-list`
- `*-pattern`

As does the `ignore*` secondary options.

## Enforce a case

You can use the regex that corresponds to your chosen case convention:

<!-- prettier-ignore -->
- kebab-case: `^([a-z][a-z0-9]*)(-[a-z0-9]+)*$`
- lowerCamelCase: `^[a-z][a-zA-Z0-9]+$`
- snake\_case: `^([a-z][a-z0-9]*)(_[a-z0-9]+)*$`
- UpperCamelCase: `^[A-Z][a-zA-Z0-9]+$`

For example, for lowerCamelCase class selectors use `"selector-class-pattern": "^[a-z][a-zA-Z0-9]+$"`.

All these patterns disallow CSS identifiers that start with a digit, two hyphens, or a hyphen followed by a digit.

## Enforce a prefix

You can ensure a prefix by using a positive lookbehind regex.

For example, to ensure all custom properties begin with `my-` use `"custom-property-pattern": "(?<=my-)"`.
