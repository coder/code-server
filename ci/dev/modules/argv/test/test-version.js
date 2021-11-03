munit( 'Root.version', { priority: munit.PRIORITY_LOW }, function( assert ) {
	argv.clear();
	if ( argv.options.version ) {
		delete argv.options.version;
	}

	assert.empty( 'Version Start', argv.options.version );
	argv.version( "1.2.4" );
	assert.exists( 'Version Option', argv.options.version );
	argv.clear();
	assert.exists( 'Version Option after Clear', argv.options.version );
});
