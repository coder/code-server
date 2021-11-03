# Working on syntaxes

Please help us enhance and debug the [syntaxes](../about/syntaxes.md) we use in stylelint:

- [postcss-css-in-js](https://github.com/stylelint/postcss-css-in-js)
- [postcss-html](https://github.com/gucong3000/postcss-html)
- [postcss-less](https://github.com/webschik/postcss-less)
- [postcss-markdown](https://github.com/stylelint/postcss-markdown)
- [postcss-sass](https://github.com/AleshaOleg/postcss-sass)
- [postcss-scss](https://github.com/postcss/postcss-scss)

To contribute to a syntax, you should:

1. Familiarize yourself with PostCSS's [how to write custom syntax](https://github.com/postcss/postcss/blob/master/docs/syntax.md) guide.
2. Use the [`syntax: *` labels](https://github.com/stylelint/stylelint/labels?utf8=%E2%9C%93&q=syntax%3A) to identify which syntax is behind an issue.
3. Go to the repository for that syntax.
4. Read their contributing guidelines.

## Workarounds

Fixing bugs in syntaxes can take time. stylelint can work around these bug by turning off autofix for incompatible sources. Autofix can then remain safe to use while contributors try to fix the underlying issue.

### Current workarounds

stylelint currently turns off autofix for sources that contain:

- ~~nested tagged template literals ([issue #4119](https://github.com/stylelint/stylelint/issues/4119))~~

### Add a workaround

To add a new workaround, you should:

1. Add code to [`lib/lintSource.js`](https://github.com/stylelint/stylelint/blob/master/lib/lintSource.js) to detect the incompatible pattern.
2. Add a corresponding test to [`lib/__tests__/standalone-fix.test.js`](https://github.com/stylelint/stylelint/blob/master/lib/__tests__/standalone-fix.test.js).
3. Document the workaround in [`docs/developer-guides/syntaxes.md`](https://github.com/stylelint/stylelint/blob/master/docs/developer-guide/syntaxes.md).
