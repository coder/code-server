# argv

argv is a nodejs module that does command line argument parsing.  
  
[![Build Status](https://travis-ci.org/codenothing/argv.png?branch=master)](https://travis-ci.org/codenothing/argv)  

### Installation

```bash
$ npm install argv
```


### Usage

```js
var argv = require( 'argv' );
var args = argv.option( options ).run();
-> { targets: [], options: {} }
```


### Run

Runs the argument parser on the global arguments. Custom arguments array can be used by passing into this method

```js
// Parses default arguments 'process.argv.slice( 2 )'
argv.run();

// Parses array instead
argv.run([ '--option=123', '-o', '123' ]);
```


### Options

argv is a strict argument parser, which means all options must be defined before parsing starts.

```js
argv.option({
	name: 'option',
	short: 'o',
	type: 'string',
	description: 'Defines an option for your script',
	example: "'script --opiton=value' or 'script -o value'"
});
```


### Modules

Modules are nested commands for more complicated scripts. Each module has it's own set of options that
have to be defined independently of the root options.

```js
argv.mod({
	mod: 'module',
	description: 'Description of what the module is used for',
	options: [ list of options ]
});
```


### Types

Types convert option values to useful js objects. They are defined along with each option.

* **string**: Ensure values are strings
* **path**: Converts value into a fully resolved path.
* **int**: Converts value into an integer
* **float**: Converts value into a float number
* **boolean**: Converts value into a boolean object. 'true' and '1' are converted to true, everything else is false.
* **csv**: Converts value into an array by splitting on comma's.
* **list**: Allows for option to be defined multiple times, and each value added to an array
* **[list|csv],[type]**: Combo type that allows you to create a list or csv and convert each individual value into a type.

```js
argv.option([
	{
		name: 'option',
		type: 'csv,int'
	},
	{
		name: 'path',
		short: 'p',
		type: 'list,path'
	}
]);

// csv and int combo
$ script --option=123,456.001,789.01
-> option: [ 123, 456, 789 ]

// list and path combo
$ script -p /path/to/file1 -p /path/to/file2
-> option: [ '/path/to/file1', '/path/to/file2' ]
```

You can also create your own custom type for special conversions.

```js
argv.type( 'squared', function( value ) {
	value = parseFloat( value );
	return value * value;
});

argv.option({
	name: 'square',
	short: 's',
	type: 'squared'
});

$ script -s 2
-> 4
```


### Version

Defining the scripts version number will add the version option and print it out when asked.

```js
argv.version( 'v1.0' );

$ script --version
v1.0

```


### Info

Custom information can be displayed at the top of the help printout using this method

```js
argv.info( 'Special script info' );

$ script --help

Special script info

... Rest of Help Doc ...
```


### Clear

If you have competing scripts accessing the argv object, you can clear out any previous options that may have been set.

```js
argv.clear().option( [new options] );
```


### Help

argv injects a default help option initially and on clears. The help() method triggers the help printout.

```js
argv.help();
```

----
### License

```
The MIT License

Copyright (c) 2012-2013 Corey Hart

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
