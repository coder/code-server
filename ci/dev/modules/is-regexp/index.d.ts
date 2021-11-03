/**
Check if a value is a regular expression.

@example
```
import isRegexp = require('is-regexp');

isRegexp('unicorn');
//=> false

isRegexp(/unicorn/);
//=> true

isRegexp(new RegExp('unicorn'));
//=> true
```
*/
declare function isRegexp(input: unknown): input is RegExp;

export = isRegexp;
