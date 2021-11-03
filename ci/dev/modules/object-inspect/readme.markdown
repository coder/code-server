# object-inspect

string representations of objects in node and the browser

[![build status](https://secure.travis-ci.com/inspect-js/object-inspect.png)](https://travis-ci.com/inspect-js/object-inspect)

# example

## circular

``` js
var inspect = require('object-inspect');
var obj = { a: 1, b: [3,4] };
obj.c = obj;
console.log(inspect(obj));
```

## dom element

``` js
var inspect = require('object-inspect');

var d = document.createElement('div');
d.setAttribute('id', 'beep');
d.innerHTML = '<b>wooo</b><i>iiiii</i>';

console.log(inspect([ d, { a: 3, b : 4, c: [5,6,[7,[8,[9]]]] } ]));
```

output:

```
[ <div id="beep">...</div>, { a: 3, b: 4, c: [ 5, 6, [ 7, [ 8, [ ... ] ] ] ] } ]
```

# methods

``` js
var inspect = require('object-inspect')
```

## var s = inspect(obj, opts={})

Return a string `s` with the string representation of `obj` up to a depth of `opts.depth`.

Additional options:
  - `quoteStyle`: must be "single" or "double", if present. Default `'single'` for strings, `'double'` for HTML elements.
  - `maxStringLength`: must be `0`, a positive integer, `Infinity`, or `null`, if present. Default `Infinity`.
  - `customInspect`: When `true`, a custom inspect method function will be invoked. Default `true`.
  - `indent`: must be "\t", `null`, or a positive integer. Default `null`.

# install

With [npm](https://npmjs.org) do:

```
npm install object-inspect
```

# license

MIT
