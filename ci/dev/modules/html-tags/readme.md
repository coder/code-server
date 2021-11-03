# html-tags [![Build Status](https://travis-ci.org/sindresorhus/html-tags.svg?branch=master)](https://travis-ci.org/sindresorhus/html-tags)

> List of standard HTML tags

It's just a couple of JSON files that can be used in any environment.

It intentionally leaves out obsolete tags.


## Install

```
$ npm install html-tags
```


## Usage

```js
const htmlTags = require('html-tags');

console.log(htmlTags);
//=> ['a', 'abbr', 'acronym', …]
```

And void (self-closing) tags:

```js
const voidHtmlTags = require('html-tags/void');

console.log(voidHtmlTags);
//=> ['area', 'base', 'br', …]
```


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
