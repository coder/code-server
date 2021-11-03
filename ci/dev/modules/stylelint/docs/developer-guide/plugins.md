# Writing plugins

Plugins are rules and sets of rules built by the community.

We recommend your plugin adheres to [stylelint's conventions](rules.md) for:

- names
- options
- messages
- tests
- docs

## The anatomy of a plugin

```js
// Abbreviated example
const stylelint = require("stylelint");

const ruleName = "plugin/foo-bar";
const messages = stylelint.utils.ruleMessages(ruleName, {
  expected: "Expected ..."
});

module.exports = stylelint.createPlugin(
  ruleName,
  function (primaryOption, secondaryOptionObject) {
    return function (postcssRoot, postcssResult) {
      const validOptions = stylelint.utils.validateOptions(
        postcssResult,
        ruleName,
        {
          /* .. */
        }
      );

      if (!validOptions) {
        return;
      }

      // ... some logic ...
      stylelint.utils.report({
        /* .. */
      });
    };
  }
);

module.exports.ruleName = ruleName;
module.exports.messages = messages;
```

Your plugin's rule name must be namespaced, e.g. `your-namespace/your-rule-name`, to ensure it never clashes with the built-in rules. If your plugin provides only a single rule or you can't think of a good namespace, you can use `plugin/my-rule`. _You should document your plugin's rule name (and namespace) because users need to use them in their config._

Use `stylelint.createPlugin(ruleName, ruleFunction)` to ensure that your plugin is set up properly alongside other rules.

For your plugin rule to work with the [standard configuration format](../user-guide/configure.md#rules), `ruleFunction` should accept 2 arguments:

- the primary option
- optionally, a secondary options object

If your plugin rule supports [autofixing](rules.md#add-autofix), then `ruleFunction` should also accept a third argument: `context`. You should try to support the `disableFix` option in your secondary options object. Within the rule, don't perform autofixing if the user has passed a `disableFix` option for your rule.

`ruleFunction` should return a function that is essentially a little [PostCSS plugin](https://github.com/postcss/postcss/blob/master/docs/writing-a-plugin.md). It takes 2 arguments:

- the PostCSS Root (the parsed AST)
- the PostCSS LazyResult

You'll have to [learn about the PostCSS API](https://api.postcss.org/).

### Asynchronous rules

You can return a `Promise` instance from your plugin function to create an asynchronous rule.

```js
// Abbreviated asynchronous example
const stylelint = require("stylelint");

const ruleName = "plugin/foo-bar-async";
const messages = stylelint.utils.ruleMessages(ruleName, {
  expected: "Expected ..."
});

module.exports = stylelint.createPlugin(
  ruleName,
  function (primaryOption, secondaryOptionObject) {
    return function (postcssRoot, postcssResult) {
      const validOptions = stylelint.utils.validateOptions(
        postcssResult,
        ruleName,
        {
          /* .. */
        }
      );

      if (!validOptions) {
        return;
      }

      return new Promise(function (resolve) {
        // some async operation
        setTimeout(function () {
          // ... some logic ...
          stylelint.utils.report({
            /* .. */
          });
          resolve();
        }, 1);
      });
    };
  }
);

module.exports.ruleName = ruleName;
module.exports.messages = messages;
```

## Testing

You should use [`jest-preset-stylelint`](https://github.com/stylelint/jest-preset-stylelint) to test your plugin. The preset exposes a global `testRule` function that you can use to efficiently test your plugin using a schema.

For example:

```js
// index.test.js
const { messages, ruleName } = require(".");

testRule({
  plugins: ["./index.js"],
  ruleName,
  config: true,
  fix: true,

  accept: [
    {
      code: ".class {}"
    },
    {
      code: ".my-class {}"
    }
  ],

  reject: [
    {
      code: ".myClass {}",
      fixed: ".my-class {}",
      message: messages.expected(),
      line: 1,
      column: 1
    }
  ]
});
```

However, if your plugin involves more than just checking syntax you can use stylelint directly.

For example:

```js
// index.test.js
const { lint } = require("stylelint");

const config = {
  plugins: ["./index.js"],
  rules: {
    "plugin/at-import-no-unresolveable": [true]
  }
};

it("warns for unresolveable import", async () => {
  const {
    results: [{ warnings, parseErrors }]
  } = await lint({
    files: "fixtures/contains-unresolveable-import.css",
    config
  });

  expect(parseErrors).toHaveLength(0);
  expect(warnings).toHaveLength(1);

  const [{ line, column, text }] = warnings;

  expect(text).toBe(
    "Unexpected unresolveable import (plugin/at-import-no-unresolveable)"
  );
  expect(line).toBe(1);
  expect(column).toBe(1);
});

it("doesn't warn for fileless sources", async () => {
  const {
    results: [{ warnings, parseErrors }]
  } = await lint({
    code: "@import url(unknown.css)",
    config
  });
  expect(parseErrors).toHaveLength(0);
  expect(warnings).toHaveLength(0);
});
```

Alternatively, if you don't want to use Jest you'll find more tools in [awesome stylelint](https://github.com/stylelint/awesome-stylelint#tools).

## `stylelint.utils`

stylelint exposes some useful utilities.

### `stylelint.utils.report`

Adds violations from your plugin to the list of violations that stylelint will report to the user.

Use `stylelint.utils.report` to ensure your plugin respects disabled ranges and other possible future features of stylelint. _Do not use PostCSS's `node.warn()` method directly._

### `stylelint.utils.ruleMessages`

Tailors your messages to the format of standard stylelint rules.

### `stylelint.utils.validateOptions`

Validates the options for your rule.

### `stylelint.utils.checkAgainstRule`

Checks CSS against a standard stylelint rule _within your own rule_. This function provides power and flexibility for plugins authors who wish to modify, constrain, or extend the functionality of existing stylelint rules.

It accepts an options object and a callback that is invoked with warnings from the specified rule. The options are:

- `ruleName`: the name of the rule you are invoking
- `ruleSettings`: settings for the rule you are invoking
- `root`: the root node to run this rule against

Use the warning to create a _new_ warning _from your plugin rule_ that you report with `stylelint.utils.report`.

For example, imagine you want to create a plugin that runs `at-rule-no-unknown` with a built-in list of exceptions for at-rules provided by your preprocessor-of-choice:

```js
const allowableAtRules = [
  /* .. */
];

function myPluginRule(primaryOption, secondaryOptionObject) {
  return function (postcssRoot, postcssResult) {
    const defaultedOptions = Object.assign({}, secondaryOptionObject, {
      ignoreAtRules: allowableAtRules.concat(options.ignoreAtRules || [])
    });

    stylelint.utils.checkAgainstRule(
      {
        ruleName: "at-rule-no-unknown",
        ruleSettings: [primaryOption, defaultedOptions],
        root: postcssRoot
      },
      (warning) => {
        stylelint.utils.report({
          message: myMessage,
          ruleName: myRuleName,
          result: postcssResult,
          node: warning.node,
          line: warning.line,
          column: warning.column
        });
      }
    );
  };
}
```

## `stylelint.rules`

All of the rule functions are available at `stylelint.rules`. This allows you to build on top of existing rules for your particular needs.

A typical use-case is to build in more complex conditionals that the rule's options allow for. For example, maybe your codebase uses special comment directives to customize rule options for specific stylesheets. You could build a plugin that checks those directives and then runs the appropriate rules with the right options (or doesn't run them at all).

All rules share a common signature. They are a function that accepts two arguments: a primary option and a secondary options object. And that functions returns a function that has the signature of a PostCSS plugin, expecting a PostCSS root and result as its arguments.

Here's an example of a plugin that runs `color-hex-case` only if there is a special directive `@@check-color-hex-case` somewhere in the stylesheet:

```js
module.exports = stylelint.createPlugin(ruleName, function (expectation) {
  const runColorHexCase = stylelint.rules["color-hex-case"](expectation);

  return (root, result) => {
    if (root.toString().indexOf("@@check-color-hex-case") === -1) {
      return;
    }

    runColorHexCase(root, result);
  };
});
```

## Allow primary option arrays

If your plugin can accept an array as its primary option, you must designate this by setting the property `primaryOptionArray = true` on your rule function. For more information, check out the ["Working on rules"](rules.md) doc.

## External helper modules

In addition to the standard parsers mentioned in the ["Working on rules"](rules.md) doc, there are other external modules used within stylelint that we recommend using. These include:

- [normalize-selector](https://github.com/getify/normalize-selector): normalize CSS selectors.
- [postcss-resolve-nested-selector](https://github.com/davidtheclark/postcss-resolve-nested-selector): given a (nested) selector in a PostCSS AST, return an array of resolved selectors.

Have a look through [stylelint's internal utils](https://github.com/stylelint/stylelint/tree/master/lib/utils) and if you come across one that you need in your plugin, then please consider helping us extract it out into an external module.

## Peer dependencies

You should express, within the `peerDependencies` key (and **not** within the `dependencies` key) of your plugin's `package.json`, what version(s) of stylelint your plugin can be used with. This is to ensure that different versions of stylelint are not unexpectedly installed.

For example, to express that your plugin can be used with stylelint versions 7 and 8:

```json
{
  "peerDependencies": {
    "stylelint": "^7.0.0 || ^8.0.0"
  }
}
```

## Plugin packs

To make a single module provide multiple rules, export an array of plugin objects (rather than a single object).

## Sharing plugins and plugin packs

Use the `stylelint-plugin` keyword within your `package.json`.
