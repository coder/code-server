'use strict';

var ES = require('../').ES5;
var boundES = require('./helpers/createBoundESNamespace')(ES);

var ops = require('../operations/es5');

var expectedMissing = [
	'SplitMatch'
];

require('./tests').es5(boundES, ops, expectedMissing);

require('./helpers/runManifestTest')(require('tape'), ES, 5);
