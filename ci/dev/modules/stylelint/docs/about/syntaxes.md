# Syntaxes

There are many styling languages, ranging from CSS language extensions like SCSS to entirely different notations, e.g. CSS-in-JS objects.

These styling languages can be embedded within other languages too. For example:

- HTML `<style>` tags
- markdown fences
- JavaScript template literals

We aim to support all these use cases in stylelint, but it's a complicated endeavor.

We lean on [PostCSS syntaxes](https://github.com/postcss/postcss#syntaxes) to help us with this task. We use them to transform these languages into something that resembles CSS, which is the language that:

- underpins all the other styling languages
- is best understood by rules built into stylelint

If you write your styles in anything other than CSS, please consider [contributing to these syntaxes](../developer-guide/syntaxes.md) so that they can remain compatible with stylelint.
