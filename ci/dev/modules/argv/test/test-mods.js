munit( 'Modules', function( assert ) {
	argv.clear().option([

		{
			name: 'bool',
			short: 'a',
			type: 'boolean'
		},

		{
			name: 'bool2',
			short: 'b',
			type: 'boolean'
		},

		{
			name: 'bool3',
			short: 'c',
			type: 'boolean'
		},

		{
			name: 'path',
			short: 'p',
			type: 'path'
		},

		{
			mod: 'mod',
			options: [

				{
					name: 'bool',
					short: 'a',
					type: 'boolean'
				},

				{
					name: 'bool2',
					short: 'b',
					type: 'boolean'
				},

				{
					name: 'bool3',
					short: 'c',
					type: 'boolean'
				},

				{
					name: 'path',
					short: 'p',
					type: 'path'
				}

			]
		}

	]);

	[

		{
			name: 'root',
			args: 'targ1 -p /a/b/c targ2 -abc targ3',
			targets: [ 'targ1', 'targ2', 'targ3' ],
			options: {
				path: '/a/b/c',
				bool: true,
				bool2: true,
				bool3: true
			}
		},

		{
			name: 'mod',
			args: 'mod targ1 -ab',
			mod: 'mod',
			targets: [ 'targ1' ],
			options: {
				bool: true,
				bool2: true
			}
		},

		{
			name: 'mod-path',
			args: 'mod targ1 -p /a/b/c',
			mod: 'mod',
			targets: [ 'targ1' ],
			options: {
				path: '/a/b/c'
			}
		}

	].forEach(function( object ) {
		var args = argv.run( argv.isArray( object.args ) ? object.args : object.args.split( ' ' ) );

		// Option parsing
		assert.deepEqual( object.name + '::options', args.options, object.options );

		// Mod comparison
		if ( object.mod ) {
			assert.equal( object.name + '::mod', args.mod, object.mod );
		}
		else {
			assert.ok( object.name + '::mod', ! args.mod );
		}

		// Target comparison
		if ( object.targets ) {
			assert.deepEqual( object.name + '::targets', args.targets, object.targets );
		}
		else {
			assert.ok( object.name + '::targets', ! args.targets.length );
		}
	});
});
