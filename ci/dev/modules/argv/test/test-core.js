munit( 'Root.Options', function( assert ) {
	argv.clear().option([

		{
			name: 'bool',
			short: 'b',
			type: 'boolean'
		},

		{
			name: 'path',
			short: 'p',
			type: 'path'
		},

		{
			name: 'int',
			short: 'i',
			type: 'int'
		},

		{
			name: 'float',
			short: 'f',
			type: 'float'
		},

		{
			name: 'csv',
			short: 'c',
			type: 'csv'
		},

		{
			name: 'list',
			short: 'l',
			type: 'list'
		},

		{
			name: 'listpath',
			short: 't',
			type: 'list,path'
		},

		{
			name: 'csvcombo',
			type: 'csv,int'
		},

		{
			name: 'bool2',
			short: 'x',
			type: 'boolean'
		},

		{
			name: 'bool3',
			short: 'y',
			type: 'boolean'
		},

		{
			name: 'bool4',
			short: 'z',
			type: 'boolean'
		}

	]);

	// Tests
	[

		{
			name: 'basic',
			args: '-b false --path=/a/b/c -i 123.456 --float=123.456 -c a,b,c -l a -l b -l c',
			options: {
				bool: false,
				path: '/a/b/c',
				'int': 123,
				'float': 123.456,
				csv: [ 'a', 'b', 'c' ],
				list: [ 'a', 'b', 'c' ]
			}
		},

		{
			name: 'path-relative',
			args: '-p a/b/c',
			options: {
				path: process.cwd() + '/a/b/c'
			}
		},

		{
			name: 'path-home',
			args: '-p ~/a/b/c',
			options: {
				path: process.env.HOME + '/a/b/c'
			}
		},

		{
			name: 'listpath',
			args: '-t ~/a/b/c -t /a/b/c -t a/b/c',
			options: {
				listpath: [
					process.env.HOME + '/a/b/c',
					'/a/b/c',
					process.cwd() + '/a/b/c'
				]
			}
		},

		{
			name: 'csvcombo',
			args: '--csvcombo=123,456.99,0.00001',
			options: {
				csvcombo: [ 123, 456, 0 ]
			}
		},

		{
			name: 'targets',
			args: 'targ1 -p /a/b/c targ2 targ3 --bool targ4',
			targets: [ 'targ1', 'targ2', 'targ3', 'targ4' ],
			options: {
				path: '/a/b/c',
				bool: true
			}
		},

		{
			name: 'bool-target-test',
			args: 'targ1 -b targ2',
			targets: [ 'targ1', 'targ2' ],
			options: {
				bool: true
			}
		},

		{
			name: 'bool-multi-option',
			args: 'targ1 -bxy targ2 -z targ3',
			targets: [ 'targ1', 'targ2', 'targ3' ],
			options: {
				bool: true,
				bool2: true,
				bool3: true,
				bool4: true
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
});
