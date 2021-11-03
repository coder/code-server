# Configuration

stylelint _expects a configuration object_.

stylelint uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) to find and load your configuration object. Starting from the current working directory, it looks for the following possible sources:

- a `stylelint` property in `package.json`
- a `.stylelintrc` file
- a `stylelint.config.js` file exporting a JS object
- a `stylelint.config.cjs` file exporting a JS object. When running stylelint in JavaScript packages that specify `"type":"module"` in their `package.json`

The search stops when one of these is found, and stylelint uses that object. You can use the [`--config` or `configFile` option](usage/options.md#configfile) to short-circuit the search.

The `.stylelintrc` file (without extension) can be in JSON or YAML format. You can add a filename extension to help your text editor provide syntax checking and highlighting:

- `.stylelintrc.json`
- `.stylelintrc.yaml` / `.stylelintrc.yml`
- `.stylelintrc.js`

The configuration object has the following properties:

## `rules`

Rules determine what the linter looks for and complains about. There are [over 170 rules](rules/list.md) built into stylelint.

_No rules are turned on by default and there are no default values. You must explicitly configure each rule to turn it on._

The `rules` property is _an object whose keys are rule names and values are rule configurations_. For example:

```json
{
  "rules": {
    "color-no-invalid-hex": true
  }
}
```

Each rule configuration fits one of the following formats:

- `null` (to turn the rule off)
- a single value (the primary option)
- an array with two values (`[primary option, secondary options]`)

Specifying a primary option turns on a rule.

Many rules provide secondary options for further customization. To set secondary options, use a two-member array. For example:

```json
{
  "rules": {
    "selector-pseudo-class-no-unknown": [
      true,
      {
        "ignorePseudoClasses": ["global"]
      }
    ]
  }
}
```

You can add any number of keys in the object. For example, you can:

- turn off `block-no-empty`
- turn on `comment-empty-line-before` with a primary and secondary option
- turn on `max-empty-lines` and `unit-allowed-list` with primary options

```json
{
  "rules": {
    "block-no-empty": null,
    "comment-empty-line-before": [
      "always",
      {
        "ignore": ["stylelint-commands", "after-comment"]
      }
    ],
    "max-empty-lines": 2,
    "unit-allowed-list": ["em", "rem", "%", "s"]
  }
}
```

### `message`

You can use the `message` secondary option to deliver a custom message when a rule is violated.

For example, the following rule configuration would substitute in custom messages:

```json
{
  "rules": {
    "color-hex-case": [
      "lower",
      {
        "message": "Lowercase letters are easier to distinguish from numbers"
      }
    ],
    "indentation": [
      2,
      {
        "except": ["block"],
        "message": "Please use 2 spaces for indentation.",
        "severity": "warning"
      }
    ]
  }
}
```

Alternately, you can write a [custom formatter](../developer-guide/formatters.md) for maximum control if you need serious customization.

### `severity`

You can use the `severity` secondary option to adjust any specific rule's severity.

The available values for `severity` are:

- `"warning"`
- `"error"` (default)

For example:

```json
{
  "rules": {
    "indentation": [
      2,
      {
        "except": ["value"],
        "severity": "warning"
      }
    ]
  }
}
```

Reporters may use these severity levels to display violations or exit the process differently.

### `reportDisables`

You can set the `reportDisables` secondary option to report any `stylelint-disable` comments for this rule, effectively disallowing authors to opt out of it.

For example:

```json
{
  "rules": {
    "indentation": [
      2,
      {
        "except": ["value"],
        "reportDisables": true
      }
    ]
  }
}
```

The report is considered to be a lint error.

## Disable Errors

These configurations provide extra validation for `stylelint-disable` comments. This can be helpful for enforcing useful and well-documented disables.

They are configured like rules. They can have one of three values:

- `null` (to turn the configuration off)
- `true` or `false` (the primary option)
- an array with two values (`[primary option, secondary options]`)

The following secondary options are available:

- `"except"` takes an array of rule names for which the primary option should be inverted.
- `"severity"` adjusts the level of error emitted for the rule, [as above](#severity).

For example, this produces errors for needless disables of all rules except `selector-max-type`:

```json
{
  "reportNeedlessDisables": [true, { "except": ["selector-max-type"] }]
}
```

And this emits warnings for disables of `color-hex-case` that don't have a description:

```json
{
  "reportDescriptionlessDisables": [
    false,
    {
      "except": ["color-hex-case"],
      "severity": "warning"
    }
  ]
}
```

### `reportNeedlessDisables`

Emit errors for `stylelint-disable` comments that don't actually match any lints that need to be disabled.

For example:

```json
{
  "reportNeedlessDisables": true
}
```

### `reportInvalidScopeDisables`

Emit errors for `stylelint-disable` comments that don't match rules that are specified in the configuration object.

For example:

```json
{
  "reportInvalidScopeDisables": true
}
```

### `reportDescriptionlessDisables`

Emit errors for `stylelint-disable` comments without a description.

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

For example:

```json
{
  "reportDescriptionlessDisables": true
}
```

## `defaultSeverity`

You can set the default severity level for all rules that do not have a severity specified in their secondary options. For example, you can set the default severity to `"warning"`:

```json
{
  "defaultSeverity": "warning"
}
```

## `ignoreDisables`

Ignore `stylelint-disable` (e.g. `/* stylelint-disable block-no-empty */`) comments.

For example:

```json
{
  "ignoreDisables": true
}
```

## `extends`

You can _extend_ an existing configuration (whether your own or a third-party one).

Popular configurations include:

- [`stylelint-config-recommended`](https://github.com/stylelint/stylelint-config-recommended) - turns on just [possible error rules](rules/list.md#possible-errors)
- [`stylelint-config-standard`](https://github.com/stylelint/stylelint-config-standard) - extends recommended one by turning on 60 [stylistic rules](rules/list.md#stylistic-issues)

You'll find more in [awesome stylelint](https://github.com/stylelint/awesome-stylelint#configs).

When one configuration extends another, it starts with the other's properties then adds to and overrides what's there.

For example, you can extend the [`stylelint-config-standard`](https://github.com/stylelint/stylelint-config-standard) and then change the indentation to tabs and turn off the `number-leading-zero` rule:

```json
{
  "extends": "stylelint-config-standard",
  "rules": {
    "indentation": "tab",
    "number-leading-zero": null
  }
}
```

You can extend an array of existing configurations, with each item in the array taking precedence over the previous item (so the second item overrides rules in the first, the third item overrides rules in the first and the second, and so on, the last item overrides everything else).

For example, with `stylelint-config-standard`, then layer `myExtendableConfig` on top of that, and then override the indentation rule:

```json
{
  "extends": ["stylelint-config-standard", "./myExtendableConfig"],
  "rules": {
    "indentation": "tab"
  }
}
```

The value of `"extends"` is a "locater" (or an array of "locaters") that is ultimately `require()`d. It can fit whatever format works with Node's `require.resolve()` algorithm. That means a "locater" can be:

- the name of a module in `node_modules` (e.g. `stylelint-config-standard`; that module's `main` file must be a valid JSON configuration)
- an absolute path to a file (which makes sense if you're creating a JS object in a Node.js context and passing it in) with a `.js` or `.json` extension.
- a relative path to a file with a `.js` or `.json` extension, relative to the referencing configuration (e.g. if configA has `extends: "../configB"`, we'll look for `configB` relative to configA).

## `plugins`

Plugins are rules or sets of rules built by the community that support methodologies, toolsets, _non-standard_ CSS features, or very specific use cases.

Popular plugin packs include:

- [`stylelint-order`](https://github.com/hudochenkov/stylelint-order) - specify the ordering of things, e.g. properties within declaration blocks
- [`stylelint-scss`](https://github.com/kristerkari/stylelint-scss) - enforce a wide variety of linting rules for SCSS-like syntax

You'll find more in [awesome stylelint](https://github.com/stylelint/awesome-stylelint#plugins).

To use one, add a `"plugins"` array to your config, containing "locaters" identifying the plugins you want to use. As with `extends`, above, a "locater" can be either a:

- npm module name
- absolute path
- path relative to the invoking configuration file

Once the plugin is declared, within your `"rules"` object _you'll need to add options_ for the plugin's rule(s), just like any standard rule. Look at the plugin's documentation to know what the rule name should be.

```json
{
  "plugins": ["../special-rule.js"],
  "rules": {
    "plugin-namespace/special-rule": "everything"
  }
}
```

A "plugin" can provide a single rule or a set of rules. If the plugin you use provides a set, invoke the module in your `"plugins"` configuration value, and use the rules it provides in `"rules"`. For example:

```json
{
  "plugins": ["../some-rule-set.js"],
  "rules": {
    "some-rule-set/first-rule": "everything",
    "some-rule-set/second-rule": "nothing",
    "some-rule-set/third-rule": "everything"
  }
}
```

## `processors`

Processors are functions built by the community that hook into stylelint's pipeline, modifying code on its way into stylelint and modifying results on their way out.

**We discourage their use in favor of using the built-in [syntaxes](../about/syntaxes.md) as processors are incompatible with the [autofix feature](usage/options.md#fix).**

To use one, add a `"processors"` array to your config, containing "locaters" identifying the processors you want to use. As with `extends`, above, a "locater" can be either an npm module name, an absolute path, or a path relative to the invoking configuration file.

```json
{
  "processors": ["stylelint-my-processor"],
  "rules": {}
}
```

If your processor has options, make that item an array whose first item is the "locator" and second item is the options object.

```json
{
  "processors": [
    "stylelint-my-processor",
    ["some-other-processor", { "optionOne": true, "optionTwo": false }]
  ],
  "rules": {}
}
```

Processors can also only be used with the CLI and the Node.js API, not with the PostCSS plugin. (The PostCSS plugin ignores them.)

## `ignoreFiles`

You can provide a glob or array of globs to ignore specific files.

For example, you can ignore all JavaScript files:

```json
{
  "ignoreFiles": ["**/*.js"]
}
```

stylelint ignores the `node_modules` directory by default. However, this is overridden if `ignoreFiles` is set.

If the globs are absolute paths, they are used as is. If they are relative, they are analyzed relative to

- `configBasedir`, if it's provided;
- the config's filepath, if the config is a file that stylelint found a loaded;
- or `process.cwd()`.

The `ignoreFiles` property is stripped from extended configs: only the root-level config can ignore files.

_Note that this is not an efficient method for ignoring lots of files._ If you want to ignore a lot of files efficiently, use [`.stylelintignore`](ignore-code.md) or adjust your files globs.
