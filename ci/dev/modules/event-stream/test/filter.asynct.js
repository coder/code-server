'use strict';

var es = require('../')
  , it = require('it-is')

exports ['filter'] = function (test) {
  es.readArray([1, 2, 3, 4])
    .pipe(es.filterSync(function(e) {
      return e > 2
    }))
    .pipe(es.writeArray(function(error, array) {
      test.deepEqual([3, 4], array)
      test.end()
    }))
}

require('./helper')(module)
