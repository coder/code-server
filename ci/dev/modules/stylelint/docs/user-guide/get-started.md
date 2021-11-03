# Getting started

1\. Use [npm](https://docs.npmjs.com/about-npm/) to install stylelint and its [`standard configuration`](https://github.com/stylelint/stylelint-config-standard):

```shell
npm install --save-dev stylelint stylelint-config-standard
```

2\. Create a `.stylelintrc.json` configuration file in the root of your project:

```json
{
  "extends": "stylelint-config-standard"
}
```

3\. Run stylelint on, for example, all the CSS files in your project:

```shell
npx stylelint "**/*.css"
```

This will lint your CSS for [possible errors](rules/list.md#possible-errors) and [stylistic issues](rules/list.md#stylistic-issues).

## Customize

Now that you're up and running, you'll likely want to customize stylelint to meet your needs.

### Your configuration

You'll want to customize your configuration.

For example, you may want to use the popular:

- [`stylelint-config-sass-guidelines` config](https://github.com/bjankord/stylelint-config-sass-guidelines) if you write SCSS
- [`stylelint-order` plugin](https://github.com/hudochenkov/stylelint-order) if you want to order things like properties

You'll find more [configs](https://github.com/stylelint/awesome-stylelint#configs) and [plugins](https://github.com/stylelint/awesome-stylelint#plugins) listed in [awesome stylelint](https://github.com/stylelint/awesome-stylelint).

To further customize your stylelint configuration, you can adapt your:

- [rules](configure.md#rules)
- [shared configs](configure.md#extends)
- [plugins](configure.md#plugins)

We recommend you add [rules that limit language features](rules/list.md#limit-language-features) to your configuration, e.g. [`unit-allowed-list`](../../lib/rules/unit-allowed-list/README.md), [`selector-class-pattern`](../../lib/rules/selector-class-pattern/README.md) and [`selector-max-id`](../../lib/rules/selector-max-id/README.md). These are powerful rules that you can use to enforce non-stylistic consistency in your code.

### Your usage

You don't have to use the [Command Line Interface](usage/cli.md); you can also use the:

- [Node API](usage/node-api.md)
- [PostCSS plugin](usage/postcss-plugin.md)

There are also integrations for [editors](integrations/editor.md), [task-runners](integrations/task-runner.md) and [others](integrations/other.md) too. Our [extension for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint) is a popular choice that lets you see violations inline in your editor.
