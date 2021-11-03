# Fast Diff [![Build Status](https://travis-ci.org/jhchen/fast-diff.svg)](https://travis-ci.org/jhchen/fast-diff)

This is a simplified import of the excellent [diff-match-patch](https://code.google.com/p/google-diff-match-patch/) library by [Neil Fraser](https://neil.fraser.name/) into the Node.js environment. The match and patch parts are removed, as well as all the extra diff options. What remains is incredibly fast diffing between two strings.

 The diff function is an implementation of ["An O(ND) Difference Algorithm and its Variations" (Myers, 1986)](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.4.6927&rep=rep1&type=pdf) with the suggested divide and conquer strategy along with several [optimizations](http://neil.fraser.name/news/2007/10/09/) Neil added.

```js
var diff = require('fast-diff');

var good = 'Good dog';
var bad = 'Bad dog';

var result = diff(good, bad);
// [[-1, "Goo"], [1, "Ba"], [0, "d dog"]]

// Respect suggested edit location (cursor position), added in v1.1
diff('aaa', 'aaaa', 1)
// [[0, "a"], [1, "a"], [0, "aa"]]

// For convenience
diff.INSERT === 1;
diff.EQUAL === 0;
diff.DELETE === -1;
```
