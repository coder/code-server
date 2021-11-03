# stylelint-config-recommended

[![NPM version](https://img.shields.io/npm/v/stylelint-config-recommended.svg)](https://www.npmjs.org/package/stylelint-config-recommended) [![Build Status](https://github.com/stylelint/stylelint-config-recommended/workflows/CI/badge.svg)](https://github.com/stylelint/stylelint-config-recommended/actions)

> The recommended shareable config for stylelint.

It turns on all the [_possible errors_](https://stylelint.io/user-guide/rules#possible-errors) rules within stylelint.

Use it as is or as a foundation for your own config.

## Installation

```bash
npm install stylelint-config-recommended --save-dev
```

## Usage

If you've installed `stylelint-config-recommended` locally within your project, just set your `stylelint` config to:

```json
{
  "extends": "stylelint-config-recommended"
}
```

If you've globally installed `stylelint-config-recommended` using the `-g` flag, then you'll need to use the absolute path to `stylelint-config-recommended` in your config e.g.

```json
{
  "extends": "/absolute/path/to/stylelint-config-recommended"
}
```

Since [stylelint 9.7.0](https://github.com/stylelint/stylelint/blob/9.7.0/CHANGELOG.md#970), you can simply use the globally installed configuration name instead of the absolute path:

```json
{
  "extends": "stylelint-config-recommended"
}
```

### Extending the config

Simply add a `"rules"` key to your config, then add your overrides and additions there.

For example, to change the `at-rule-no-unknown` rule to use its `ignoreAtRules` option, turn off the `block-no-empty` rule, and add the `unit-allowed-list` rule:

```json
{
  "extends": "stylelint-config-recommended",
  "rules": {
    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": ["extends"]
      }
    ],
    "block-no-empty": null,
    "unit-allowed-list": ["em", "rem", "s"]
  }
}
```

## [Changelog](CHANGELOG.md)

## [License](LICENSE)
