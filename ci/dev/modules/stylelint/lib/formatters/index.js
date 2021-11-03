'use strict';

const importLazy = require('import-lazy');

module.exports = {
	compact: importLazy(() => require('./compactFormatter'))('compactFormatter'),
	json: importLazy(() => require('./jsonFormatter'))('jsonFormatter'),
	string: importLazy(() => require('./stringFormatter'))('stringFormatter'),
	tap: importLazy(() => require('./tapFormatter'))('tapFormatter'),
	unix: importLazy(() => require('./unixFormatter'))('unixFormatter'),
	verbose: importLazy(() => require('./verboseFormatter'))('verboseFormatter'),
};
