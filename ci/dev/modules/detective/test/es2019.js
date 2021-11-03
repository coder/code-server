var test = require('tap').test;
var detective = require('../');
var fs = require('fs');

test('es2019 - for-await', function (t) {
    var src = fs.readFileSync(__dirname + '/files/for-await.js');
    t.doesNotThrow(detective.bind(detective, src), 'Files with `for await()` do not throw')
    t.end();
});

test('es2019 - optional-catch', function (t) {
    var src = fs.readFileSync(__dirname + '/files/optional-catch.js');
    t.doesNotThrow(detective.bind(detective, src), 'Files with omitted catch binding do not throw')
    t.end();
});
