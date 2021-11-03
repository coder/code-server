munit( 'Custom', function( assert ) {
	// Add custom types
	argv.type({

		'special-int': function(){
			return 777;
		},

		'special-float': function(){
			return 777.777;
		}

	});

	// Setup options
	argv.clear().option([

		{
			name: 'foo',
			type: 'special-int'
		},

		{
			name: 'bar',
			type: 'special-float'
		}

	]);

	// Tests
	[

		{
			name: 'types',
			args: '--foo=123 --bar=456',
			options: {
				foo: 777,
				bar: 777.777
			}
		}

	].forEach(function( object ) {
		var args = argv.run( argv.isArray( object.args ) ? object.args : object.args.split( ' ' ) );

		// Option parsing
		assert.deepEqual( object.name + '::options', args.options, object.options );

		// Target comparison
		if ( object.targets ) {
			assert.deepEqual( object.name + '::targets', args.targets, object.targets );
		}
		else {
			assert.ok( object.name + '::targets', ! args.targets.length );
		}
	});


	// Deletion checks
	assert.ok( 'Int Exists', argv.types[ 'special-int' ] );
	assert.ok( 'Float Exists', argv.types[ 'special-float' ] );
	argv.type( 'special-int', null );
	argv.type( 'special-float', null );
	assert.ok( 'Delete Int', ! argv.types[ 'special-int' ] );
	assert.ok( 'Delete Float', ! argv.types[ 'special-float' ] );
});
