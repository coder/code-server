declare const trimNewlines: {
	/**
	Trim from the start and end of a string.

	@example
	```js
	import trimNewlines = require('trim-newlines');

	trimNewlines('\n🦄\r\n');
	//=> '🦄'
	```
	*/
	(string: string): string;

	/**
	Trim from the start of a string.

	@example
	```js
	import trimNewlines = require('trim-newlines');

	trimNewlines.start('\n🦄\r\n');
	//=> '🦄\r\n'
	```
	*/
	start(string: string): string;

	/**
	Trim from the end of a string.

	@example
	```js
	import trimNewlines = require('trim-newlines');

	trimNewlines.end('\n🦄\r\n');
	//=> '\n🦄'
	```
	*/
	end(string: string): string;
};

export = trimNewlines;
