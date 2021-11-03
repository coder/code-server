# PostCSS plugin

As with any other [PostCSS plugin](https://github.com/postcss/postcss#plugins), you can use stylelint's PostCSS plugin either with a [PostCSS runner](https://github.com/postcss/postcss#runners) or with the PostCSS JS API directly.

_However, if a dedicated stylelint task runner plugin [is available](../integrations/task-runner.md) (e.g. [gulp-stylelint](https://github.com/olegskl/gulp-stylelint)) we recommend you use that rather than this plugin, as they provide better reporting._

## Options

The PostCSS plugin uses the [standard options](options.md), _except the `syntax` and `customSyntax` options_. Instead, the syntax must be set within the [PostCSS options](https://github.com/postcss/postcss#options) as there can only be one parser/syntax in a pipeline.

## Usage examples

We recommend you lint your CSS before applying any transformations. You can do this by either:

- creating a separate lint task that is independent of your build one.
- using the [`plugins` option](https://github.com/postcss/postcss-import#plugins) of [`postcss-import`](https://github.com/postcss/postcss-import) or [`postcss-easy-import`](https://github.com/TrySound/postcss-easy-import) to lint your files before any transformations.
- placing stylelint at the beginning of your plugin pipeline.

You'll also need to use a reporter. _The stylelint plugin registers warnings via PostCSS_. Therefore, you'll want to use it with a PostCSS runner that prints warnings or another PostCSS plugin whose purpose is to format and print warnings (e.g. [`postcss-reporter`](https://github.com/postcss/postcss-reporter)).

### Example A

A separate lint task that uses the plugin via the PostCSS JS API to lint Less using [`postcss-less`](https://github.com/shellscape/postcss-less).

```js
const fs = require("fs");
const less = require("postcss-less");
const postcss = require("postcss");

// Code to be processed
const code = fs.readFileSync("input.less", "utf8");

postcss([
  require("stylelint")({
    /* your options */
  }),
  require("postcss-reporter")({ clearReportedMessages: true })
])
  .process(code, {
    from: "input.less",
    syntax: less
  })
  .then(() => {})
  .catch((err) => console.error(err.stack));
```

The same pattern can be used to lint Less, SCSS or [SugarSS](https://github.com/postcss/sugarss) syntax.

### Example B

A combined lint and build task where the plugin is used via the PostCSS JS API, but within [`postcss-import`](https://github.com/postcss/postcss-import) (using the its `plugins` option) so that the source files are linted before any transformations.

```js
const fs = require("fs");
const postcss = require("postcss");
const stylelint = require("stylelint");

// CSS to be processed
const css = fs.readFileSync("lib/app.css", "utf8");

postcss([
  require("postcss-import")({
    plugins: [
      require("stylelint")({
        /* your options */
      })
    ]
  }),
  require("postcss-preset-env"),
  require("postcss-reporter")({ clearReportedMessages: true })
])
  .process(css, {
    from: "lib/app.css",
    to: "app.css"
  })
  .then((result) => {
    fs.writeFileSync("app.css", result.css);

    if (result.map) {
      fs.writeFileSync("app.css.map", result.map);
    }
  })
  .catch((err) => console.error(err.stack));
```
