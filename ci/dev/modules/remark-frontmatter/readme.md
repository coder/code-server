# remark-frontmatter

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[**remark**][remark] plugin to support frontmatter (YAML, TOML, and more).

## Install

[npm][]:

```sh
npm install remark-frontmatter
```

## Use

Say we have the following file, `example.md`:

```markdown
+++
title = "New Website"
+++

# Other markdown
```

And our script, `example.js`, looks as follows:

```js
var vfile = require('to-vfile')
var report = require('vfile-reporter')
var unified = require('unified')
var parse = require('remark-parse')
var stringify = require('remark-stringify')
var frontmatter = require('remark-frontmatter')

unified()
  .use(parse)
  .use(stringify)
  .use(frontmatter, ['yaml', 'toml'])
  .use(logger)
  .process(vfile.readSync('example.md'), function(err, file) {
    console.log(String(file))
    console.error(report(err || file))
  })

function logger() {
  return console.dir
}
```

Now, running `node example` yields:

```js
{ type: 'root',
  children:
   [ { type: 'toml',
       value: 'title = "New Website"',
       position: [Object] },
     { type: 'heading',
       depth: 1,
       children: [Array],
       position: [Object] } ],
  position: [Object] }
```

```markdown
example.md: no issues found
+++
title = "New Website"
+++

# Other markdown
```

## API

### `remark().use(frontmatter[, options])`

Support frontmatter (YAML, TOML, and more).
Adds [tokenizers][] if the [processor][] is configured with
[`remark-parse`][parse], and [visitors][] if configured with
[`remark-stringify`][stringify].

If you are parsing from a different syntax, or compiling to a different syntax
(such as, [`remark-man`][man]) your custom nodes may not be supported.

##### `options`

One [`preset`][preset] or [`Matter`][matter], or an array of them, defining all
the supported frontmatters (default: `'yaml'`).

##### `preset`

Either `'yaml'` or `'toml'`:

*   `'yaml'` — [`matter`][matter] defined as `{type: 'yaml', marker: '-'}`
*   `'toml'` — [`matter`][matter] defined as `{type: 'toml', marker: '+'}`

##### `Matter`

An object with a `type` and either a `marker` or a `fence`:

*   `type` (`string`)
    — Node type to parse to in [mdast][] and compile from
*   `marker` (`string` or `{open: string, close: string}`)
    — Character used to construct fences.
    By providing an object with `open` and `close`.
    different characters can be used for opening and closing fences.
    For example the character `'-'` will result in `'---'` being used as the
    fence
*   `fence` (`string` or `{open: string, close: string}`)
    — String used as the complete fence.
    By providing an object with `open` and `close` different values can be used
    for opening and closing fences.
    This can be used too if fences contain different characters or lengths other
    than 3
*   `anywhere` (`boolean`, default: `false`)
    – if `true`, matter can be found anywhere in the document.
    If `false` (default), only matter at the start of the document is recognized

###### Example

For `{type: 'yaml', marker: '-'}`:

```yaml
---
key: value
---
```

Yields:

```json
{
  "type": "yaml",
  "value": "key: value"
}
```

For `{type: 'custom', marker: {open: '<', close: '>'}}`:

```text
<<<
data
>>>
```

Yields:

```json
{
  "type": "custom",
  "value": "data"
}
```

For `{type: 'custom', fence: '+=+=+=+'}`:

```text
+=+=+=+
data
+=+=+=+
```

Yields:

```json
{
  "type": "custom",
  "value": "data"
}
```

For `{type: 'json', fence: {open: '{', close: '}'}}`:

```json
{
  "key": "value"
}
```

Yields:

```json
{
  "type": "json",
  "value": "\"key\": \"value\""
}
```

## Security

Use of `remark-frontmatter` does not involve [**rehype**][rehype]
([**hast**][hast]) or user content so there are no openings for
[cross-site scripting (XSS)][xss] attacks.

## Related

*   [`remark-github`](https://github.com/remarkjs/remark-github)
    — Auto-link references like in GitHub issues, PRs, and comments
*   [`remark-math`](https://github.com/rokt33r/remark-math)
    — Math support
*   [`remark-yaml-config`](https://github.com/remarkjs/remark-yaml-config)
    — Configure remark from YAML configuration

## Contribute

See [`contributing.md`][contributing] in [`remarkjs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/remarkjs/remark-frontmatter/master.svg

[build]: https://travis-ci.org/remarkjs/remark-frontmatter

[coverage-badge]: https://img.shields.io/codecov/c/github/remarkjs/remark-frontmatter.svg

[coverage]: https://codecov.io/github/remarkjs/remark-frontmatter

[downloads-badge]: https://img.shields.io/npm/dm/remark-frontmatter.svg

[downloads]: https://www.npmjs.com/package/remark-frontmatter

[size-badge]: https://img.shields.io/bundlephobia/minzip/remark-frontmatter.svg

[size]: https://bundlephobia.com/result?p=remark-frontmatter

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-spectrum-7b16ff.svg

[chat]: https://spectrum.chat/unified/remark

[npm]: https://docs.npmjs.com/cli/install

[health]: https://github.com/remarkjs/.github

[contributing]: https://github.com/remarkjs/.github/blob/master/contributing.md

[support]: https://github.com/remarkjs/.github/blob/master/support.md

[coc]: https://github.com/remarkjs/.github/blob/master/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[remark]: https://github.com/remarkjs/remark

[parse]: https://github.com/remarkjs/remark/tree/master/packages/remark-parse

[tokenizers]: https://github.com/remarkjs/remark/tree/master/packages/remark-parse#parserblocktokenizers

[stringify]: https://github.com/remarkjs/remark/tree/master/packages/remark-stringify

[visitors]: https://github.com/remarkjs/remark/tree/master/packages/remark-stringify#compilervisitors

[processor]: https://github.com/unifiedjs/unified#processor

[mdast]: https://github.com/syntax-tree/mdast

[man]: https://github.com/remarkjs/remark-man

[preset]: #preset

[matter]: #matter

[xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[rehype]: https://github.com/rehypejs/rehype

[hast]: https://github.com/syntax-tree/hast
