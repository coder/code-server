import {PackageJson} from 'type-fest';

declare namespace meow {
	type FlagType = 'string' | 'boolean' | 'number';

	/**
	Callback function to determine if a flag is required during runtime.

	@param flags - Contains the flags converted to camel-case excluding aliases.
	@param input - Contains the non-flag arguments.

	@returns True if the flag is required, otherwise false.
	*/
	type IsRequiredPredicate = (flags: Readonly<AnyFlags>, input: readonly string[]) => boolean;

	interface Flag<Type extends FlagType, Default> {
		readonly type?: Type;
		readonly alias?: string;
		readonly default?: Default;
		readonly isRequired?: boolean | IsRequiredPredicate;
		readonly isMultiple?: boolean;
	}

	type StringFlag = Flag<'string', string>;
	type BooleanFlag = Flag<'boolean', boolean>;
	type NumberFlag = Flag<'number', number>;

	type AnyFlag = StringFlag | BooleanFlag | NumberFlag;
	type AnyFlags = Record<string, AnyFlag>;

	interface Options<Flags extends AnyFlags> {
		/**
		Define argument flags.

		The key is the flag name in camel-case and the value is an object with any of:

		- `type`: Type of value. (Possible values: `string` `boolean` `number`)
		- `alias`: Usually used to define a short flag alias.
		- `default`: Default value when the flag is not specified.
		- `isRequired`: Determine if the flag is required.
			If it's only known at runtime whether the flag is required or not you can pass a Function instead of a boolean, which based on the given flags and other non-flag arguments should decide if the flag is required.
		- `isMultiple`: Indicates a flag can be set multiple times. Values are turned into an array. (Default: false)
			Multiple values are provided by specifying the flag multiple times, for example, `$ foo -u rainbow -u cat`. Space- or comma-separated values are *not* supported.

		Note that flags are always defined using a camel-case key (`myKey`), but will match arguments in kebab-case (`--my-key`).

		@example
		```
		flags: {
			unicorn: {
				type: 'string',
				alias: 'u',
				default: ['rainbow', 'cat'],
				isMultiple: true,
				isRequired: (flags, input) => {
					if (flags.otherFlag) {
						return true;
					}

					return false;
				}
			}
		}
		```
		*/
		readonly flags?: Flags;

		/**
		Description to show above the help text. Default: The package.json `"description"` property.

		Set it to `false` to disable it altogether.
		*/
		readonly description?: string | false;

		/**
		The help text you want shown.

		The input is reindented and starting/ending newlines are trimmed which means you can use a [template literal](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/template_strings) without having to care about using the correct amount of indent.

		The description will be shown above your help text automatically.

		Set it to `false` to disable it altogether.
		*/
		readonly help?: string | false;

		/**
		Set a custom version output. Default: The package.json `"version"` property.

		Set it to `false` to disable it altogether.
		*/
		readonly version?: string | false;

		/**
		Automatically show the help text when the `--help` flag is present. Useful to set this value to `false` when a CLI manages child CLIs with their own help text.

		This option is only considered when there is only one argument in `process.argv`.
		*/
		readonly autoHelp?: boolean;

		/**
		Automatically show the version text when the `--version` flag is present. Useful to set this value to `false` when a CLI manages child CLIs with their own version text.

		This option is only considered when there is only one argument in `process.argv`.
		*/
		readonly autoVersion?: boolean;

		/**
		`package.json` as an `Object`. Default: Closest `package.json` upwards.

		_You most likely don't need this option._
		*/
		readonly pkg?: Record<string, unknown>;

		/**
		Custom arguments object.

		@default process.argv.slice(2)
		*/
		readonly argv?: readonly string[];

		/**
		Infer the argument type.

		By default, the argument `5` in `$ foo 5` becomes a string. Enabling this would infer it as a number.

		@default false
		*/
		readonly inferType?: boolean;

		/**
		Value of `boolean` flags not defined in `argv`.

		If set to `undefined`, the flags not defined in `argv` will be excluded from the result. The `default` value set in `boolean` flags take precedence over `booleanDefault`.

		_Note: If used in conjunction with `isMultiple`, the default flag value is set to `[]`._

		__Caution: Explicitly specifying `undefined` for `booleanDefault` has different meaning from omitting key itself.__

		@example
		```
		import meow = require('meow');

		const cli = meow(`
			Usage
				$ foo

			Options
				--rainbow, -r  Include a rainbow
				--unicorn, -u  Include a unicorn
				--no-sparkles  Exclude sparkles

			Examples
				$ foo
				🌈 unicorns✨🌈
		`, {
			booleanDefault: undefined,
			flags: {
				rainbow: {
					type: 'boolean',
					default: true,
					alias: 'r'
				},
					unicorn: {
					type: 'boolean',
					default: false,
					alias: 'u'
				},
				cake: {
					type: 'boolean',
					alias: 'c'
				},
				sparkles: {
					type: 'boolean',
					default: true
				}
			}
		});

		//{
		//	flags: {
		//		rainbow: true,
		//		unicorn: false,
		//		sparkles: true
		//	},
		//	unnormalizedFlags: {
		//		rainbow: true,
		//		r: true,
		//		unicorn: false,
		//		u: false,
		//		sparkles: true
		//	},
		//	…
		//}
		```
		*/
		readonly booleanDefault?: boolean | null | undefined;

		/**
		Whether to use [hard-rejection](https://github.com/sindresorhus/hard-rejection) or not. Disabling this can be useful if you need to handle `process.on('unhandledRejection')` yourself.

		@default true
		*/
		readonly hardRejection?: boolean;

		/**
		Whether to allow unknown flags or not.

		@default true
		*/
		readonly allowUnknownFlags?: boolean;
	}

	type TypedFlag<Flag extends AnyFlag> =
		Flag extends {type: 'number'}
			? number
			: Flag extends {type: 'string'}
				? string
				: Flag extends {type: 'boolean'}
					? boolean
					: unknown;

	type PossiblyOptionalFlag<Flag extends AnyFlag, FlagType> =
		Flag extends {isRequired: true}
			? FlagType
			: Flag extends {default: any}
				? FlagType
				: FlagType | undefined;

	type TypedFlags<Flags extends AnyFlags> = {
		[F in keyof Flags]: Flags[F] extends {isMultiple: true}
			? PossiblyOptionalFlag<Flags[F], Array<TypedFlag<Flags[F]>>>
			: PossiblyOptionalFlag<Flags[F], TypedFlag<Flags[F]>>
	};

	interface Result<Flags extends AnyFlags> {
		/**
		Non-flag arguments.
		*/
		input: string[];

		/**
		Flags converted to camelCase excluding aliases.
		*/
		flags: TypedFlags<Flags> & Record<string, unknown>;

		/**
		Flags converted camelCase including aliases.
		*/
		unnormalizedFlags: TypedFlags<Flags> & Record<string, unknown>;

		/**
		The `package.json` object.
		*/
		pkg: PackageJson;

		/**
		The help text used with `--help`.
		*/
		help: string;

		/**
		Show the help text and exit with code.

		@param exitCode - The exit code to use. Default: `2`.
		*/
		showHelp: (exitCode?: number) => void;

		/**
		Show the version text and exit.
		*/
		showVersion: () => void;
	}
}
/**
@param helpMessage - Shortcut for the `help` option.

@example
```
#!/usr/bin/env node
'use strict';
import meow = require('meow');
import foo = require('.');

const cli = meow(`
	Usage
	  $ foo <input>

	Options
	  --rainbow, -r  Include a rainbow

	Examples
	  $ foo unicorns --rainbow
	  🌈 unicorns 🌈
`, {
	flags: {
		rainbow: {
			type: 'boolean',
			alias: 'r'
		}
	}
});

//{
//	input: ['unicorns'],
//	flags: {rainbow: true},
//	...
//}

foo(cli.input[0], cli.flags);
```
*/
declare function meow<Flags extends meow.AnyFlags>(helpMessage: string, options?: meow.Options<Flags>): meow.Result<Flags>;
declare function meow<Flags extends meow.AnyFlags>(options?: meow.Options<Flags>): meow.Result<Flags>;

export = meow;
