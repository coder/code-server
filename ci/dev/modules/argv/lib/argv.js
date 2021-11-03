var PATH = require( 'path' ),
	toString = Object.prototype.toString,
	rhome = /^\~\//,
	rroot = /^\//,
	rlistcsv = /^(list|csv)\,[a-z]+$/,
	rdash = /^\-/,
	rddash = /^\-\-/,
	ristarget = /^[^\-]/,
	SCRIPT_NAME = ( process.argv[ 1 ] || '' ).split( '/' ).pop(),
	helpOption = {
		name: 'help',
		short: 'h',
		type: function(){ return true; },
		description: 'Displays help information about this script',
		example: "'" + SCRIPT_NAME + " -h' or '" + SCRIPT_NAME + " --help'",
		onset: function( args ) {
			self.help( args.mod );
			process.exit( 0 );
		}
	},
	boolTest = function( value ) {
		return value == 'true' || value == 'false' || value == '1' || value == '0';
	},
	self;

// argv module
module.exports = self = {

	// Default script name
	name: SCRIPT_NAME,

	// Default description to the triggered script 'node script'
	description: 'Usage: ' + SCRIPT_NAME + ' [options]',

	// Modules
	mods: {},

	// Shorthand options
	short: { h: helpOption },

	// Options
	options: { help: helpOption },

	// List of common types
	types: {

		string: function( value ) {
			return value.toString();
		},

		path: function( value ) {
			var end = value[ value.length - 1 ] == '/';

			if ( rhome.exec( value ) ) {
				value = PATH.normalize( process.env.HOME + '/' + value.replace( rhome, '' ) );
			}
			else if ( ! rroot.exec( value ) ) {
				value = PATH.normalize( process.cwd() + '/' + value );
			}

			return value + ( end && value[ value.length - 1 ] != '/' ? '/' : '' );
		},

		'int': function( value ) {
			return parseInt( value, 10 );
		},

		'float': function( value ) {
			return parseFloat( value, 10 );
		},

		'boolean': function( value ) {
			return ( value == 'true' || value === '1' );
		},

		list: function( value, name, options ) {
			if ( ! options[ name ] ) {
				options[ name ] = [];
			}

			options[ name ].push( value );
			return options[ name ];
		},

		csv: function( value ) {
			return value.split( ',' );
		},

		'listcsv-combo': function( type ) {
			var parts = type.split( ',' ),
				primary = parts.shift(),
				secondary = parts.shift();

			return function( value, name, options, args ) {
				// Entry is going to be an array
				if ( ! options[ name ] ) {
					options[ name ] = [];
				}

				// Channel to csv or list
				if ( primary == 'csv' ) {
					value.split( ',' ).forEach(function( val ) {
						options[ name ].push( self.types[ secondary ]( val, name, options, args ) );
					});
				}
				else {
					options[ name ].push( self.types[ secondary ]( value, name, options, args ) );
				}

				return options[ name ];
			};
		}

	},

	// Creates custom type function
	type: function( name, callback ) {
		if ( self.isObject( name ) ) {
			for ( var i in name ) {
				if ( self.isFunction( name[ i ] ) ) {
					self.types[ i ] = name[ i ];
				}
			}
		}
		else if ( callback === undefined ) {
			return self.types[ name ];
		}
		else if ( self.isFunction( callback ) ) {
			self.types[ name ] = callback;
		}
		else if ( callback === null && self.types.hasOwnProperty( name ) ) {
			delete self.types[ name ];
		}

		return self;
	},

	// Setting version number, and auto setting version option
	version: function( v ) {
		self.option({
			_version: v,
			name: 'version',
			type: function(){ return true; },
			description: 'Displays version info',
			example: self.name + " --version",
			onset: function( args ) {
				console.log( v + "\n" );
				process.exit( 0 );
			}
		});

		return self;
	},

	// Adding options to definitions list
	option: function( mod, object ) {
		if ( object === undefined ) {
			object = mod;
			mod = undefined;
		}

		// Iterate over array for multi entry
		if ( self.isArray( object ) ) {
			object.forEach(function( entry ) {
				self.option( mod, entry );
			});
		}
		// Handle edge case
		else if ( ! self.isObject( object ) ) {
			throw new Error( 'No option definition provided' + ( mod ? ' for module ' + mod : '' ) );
		}
		// Handle module definition
		else if ( object.mod ) {
			self.mod( object );
		}
		// Correct the object
		else {
			if ( ! object.name ) {
				throw new Error( 'No name provided for option' );
			}
			else if ( ! object.type ) {
				throw new Error( 'No type proveded for option' );
			}

			// Attach tester for value on booleans
			// to avoid false targets
			object.test = object.test || ( object.type == 'boolean' ? boolTest : null );
			object.description = object.description || '';
			object.type = self.isFunction( object.type ) ? object.type :
				self.isString( object.type ) && rlistcsv.exec( object.type ) ? self.types[ 'listcsv-combo' ]( object.type ) :
				self.isString( object.type ) && self.types[ object.type ] ? self.types[ object.type ] :
				self.types.string;

			// Apply to module
			if ( mod ) {
				if ( ! self.mods[ mod ] ) {
					self.mods[ mod ] = { mod: mod, options: {}, short: {} };
				}

				// Attach option to submodule
				mod = self.mods[ mod ];	
				mod.options[ object.name ] = object;

				// Attach shorthand
				if ( object.short ) {
					mod.short[ object.short ] = object;
				}
			}
			// Apply to root options
			else {
				self.options[ object.name ] = object;

				// Attach shorthand option
				if ( object.short ) {
					self.short[ object.short ] = object;
				}
			}
		}

		return self;
	},

	// Creating module
	mod: function( object ) {
		var mod;

		// Allow multi mod setup
		if ( self.isArray( object ) ) {
			object.forEach(function( value ) {
				self.mod( value );
			});
		}
		// Handle edge case
		else if ( ! self.isObject( object ) ) {
			throw new Error( 'No mod definition provided' );
		}
		// Force mod name
		else if ( ! object.mod ) {
			throw new Error( "Expecting 'mod' entry for module" );
		}
		// Create object if not already done so
		else if ( ! self.mods[ object.mod ] ) {
			self.mods[ object.mod ] = { mod: object.mod, options: {}, short: {} };
		}

		// Setup
		mod = self.mods[ object.mod ];
		mod.description = object.description || mod.description;

		// Attach each option
		self.option( mod.mod, object.options );

		return self;
	},

	// Cleans out current options
	clear: function(){
		var version = self.options.version;

		// Clean out modes and reapply help option
		self.short = {};
		self.options = {};
		self.mods = {};
		self.option( helpOption );

		// Re-apply version if set
		if ( version ) {
			self.option( version );
		}

		return self;
	},

	// Description setup
	info: function( mod, description ) {
		if ( description === undefined ) {
			self.description = mod;
		}
		else if ( self.mods[ mod ] ) {
			self.mods[ mod ] = description;
		}

		return self;
	},

	// Prints out the help doc
	help: function( mod ) {
		var output = [], name, option;

		// Printing out just a module's definitions
		if ( mod && ( mod = self.mods[ mod ] ) ) {
			output = [ '', mod.description, '' ];

			for ( name in mod.options ) {
				option = mod.options[ name ];

				output.push( "\t--" +option.name + ( option.short ? ', -' + option.short : '' ) );
				output.push( "\t\t" + option.description );
				if ( option.example ) {
					output.push( "\t\t" + option.example );
				}

				// Spacing
				output.push( "" );
			}
		}
		// Printing out just the root options
		else {
			output = [ '', self.description, '' ];

			for ( name in self.options ) {
				option = self.options[ name ];

				output.push( "\t--" +option.name + ( option.short ? ', -' + option.short : '' ) );
				output.push( "\t\t" + option.description );
				if ( option.example ) {
					output.push( "\t\t" + option.example );
				}

				// Spacing
				output.push( "" );
			}
		}

		// Print out the output
		console.log( output.join( "\n" ) + "\n\n" );
		return self;
	},

	// Runs the arguments parser
	_run: function( argv ) {
		var args = { targets: [], options: {} },
			opts = self.options,
			shortOpts = self.short,
			skip = false;

		// Allow for passing of arguments list
		argv = self.isArray( argv ) ? argv : process.argv.slice( 2 );

		// Switch to module's options when used
		if ( argv.length && ristarget.exec( argv[ 0 ] ) && self.mods[ argv[ 0 ] ] ) {
			args.mod = argv.shift();
			opts = self.mods[ args.mod ].options;
			shortOpts = self.mods[ args.mod ].short;
		}

		// Iterate over arguments
		argv.forEach(function( arg, i ) {
			var peek = argv[ i + 1 ], option, index, value;

			// Allow skipping of arguments
			if ( skip ) {
				return ( skip = false );
			}
			// Full option '--option'
			else if ( rddash.exec( arg ) ) {
				arg = arg.replace( rddash, '' );

				// Default no value to true
				if ( ( index = arg.indexOf( '=' ) ) !== -1 ) {
					value = arg.substr( index + 1 );
					arg = arg.substr( 0, index );
				}
				else {
					value = 'true';
				}

				// Be strict, if option doesn't exist, throw and error
				if ( ! ( option = opts[ arg ] ) ) {
					throw "Option '--" + arg + "' not supported";
				}

				// Send through type converter
				args.options[ arg ] = option.type( value, arg, args.options, args );

				// Trigger onset callback when option is set
				if ( self.isFunction( option.onset ) ) {
					option.onset( args );
				}
			}
			// Shorthand option '-o'
			else if ( rdash.exec( arg ) ) {
				arg = arg.replace( rdash, '' );

				if ( arg.length > 1 ) {
					arg.split( '' ).forEach(function( character ) {
						if ( ! ( option = shortOpts[ character ] ) ) {
							throw "Option '-" + character + "' not supported";
						}

						args.options[ option.name ] = option.type( 'true', option.name, args.options, args );
					});
				}
				else {
					// Ensure that an option exists
					if ( ! ( option = shortOpts[ arg ] ) ) {
						throw "Option '-" + arg + "' not supported";
					}

					// Check next option for target association
					if ( peek && option.test && option.test( peek, option.name, args.options, args ) ) {
						value = peek;
						skip = true;
					}
					else if ( peek && ! option.test && ristarget.exec( peek ) ) {
						value = peek;
						skip = true;
					}
					else {
						value = 'true';
					}

					// Convert it
					args.options[ option.name ] = option.type( value, option.name, args.options, args );

					// Trigger onset callback when option is set
					if ( self.isFunction( option.onset ) ) {
						option.onset( args );
					}
				}
			}
			// Targets
			else {
				args.targets.push( arg );
			}
		});

		return args;
	},

	run: function( argv ) {
		try {
			return self._run( argv );
		}
		catch ( e ) {
			if ( ! self.isString( e ) ) {
				throw e;
			}

			console.log( "\n" + e + ". Trigger '" + self.name + " -h' for more details.\n\n" );
			process.exit( 1 );
		}
	}

};


// Type tests
"Boolean Number String Function Array Date RegExp Object Error".split(' ').forEach(function( method ) {
	if ( method == 'Array' ) {
		return ( self.isArray = Array.isArray );
	}
	else if ( method == 'Error' ) {
		self.isError = function( object ) {
			return object && ( object instanceof Error );
		};

		return;
	}

	var match = '[object ' + method + ']';
	self[ 'is' + method ] = function( object ) {
		return object !== undefined && object !== null && toString.call( object ) == match;
	};
});
