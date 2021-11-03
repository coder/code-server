declare namespace cloneRegexp {
	interface Options {
		/**
		Modifies the [`source`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/source) property of the cloned `RegExp` instance.
		*/
		source?: string;

		/**
		Modifies the [`global`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/global) property of the cloned `RegExp` instance.
		*/
		global?: boolean;

		/**
		Modifies the [`ignoreCase`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/ignoreCase) property of the cloned `RegExp` instance.
		*/
		ignoreCase?: boolean;

		/**
		Modifies the [`multiline`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/multiline) property of the cloned `RegExp` instance.
		*/
		multiline?: boolean;

		/**
		Modifies the [`dotAll`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/dotAll) property of the cloned `RegExp` instance.
		*/
		dotAll?: boolean;

		/**
		Modifies the [`sticky`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky) property of the cloned `RegExp` instance.
		*/
		sticky?: boolean;

		/**
		Modifies the [`unicode`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicode) property of the cloned `RegExp` instance.
		*/
		unicode?: boolean;

		/**
		Modifies the [`lastIndex`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex) property of the cloned `RegExp` instance.
		*/
		lastIndex?: number;
	}
}

/**
Clone and modify a [RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) instance.

@param regexp - Regex to clone.

@example
```
import cloneRegexp = require('clone-regexp');

const regex = /[a-z]/gi;

cloneRegexp(regex);
//=> /[a-z]/gi

cloneRegexp(regex) === regex;
//=> false

cloneRegexp(regex, {global: false});
//=> /[a-z]/i

cloneRegexp(regex, {multiline: true});
//=> /[a-z]/gim

cloneRegexp(regex, {source: 'unicorn'});
//=> /unicorn/gi
```
*/
declare function cloneRegexp(
	regexp: RegExp,
	options?: cloneRegexp.Options
): RegExp;

export = cloneRegexp;
