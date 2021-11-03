declare namespace execall {
	interface Match {
		match: string;
		subMatches: string[];
		index: number;
	}
}

/**
Find multiple RegExp matches in a string.

@param regexp - Regular expression to match against the `string`.
@returns The matches.

@example
```
import execall = require('execall');

execall(/(\d+)/g, '$200 and $400');
// [
// 	{
// 		match: '200',
// 		subMatches: ['200'],
// 		index: 1
// 	},
// 	{
// 		match: '400',
// 		subMatches: ['400'],
// 		index: 10
// 	}
// ]
```
*/
declare function execall(regexp: RegExp, string: string): execall.Match[];

export = execall;
