/* eslint-disable no-unused-expressions */
var bench = require('nanobench')
var acornsrc = require('fs').readFileSync(require.resolve('acorn'))
var lodashsrc = require('fs').readFileSync(require.resolve('lodash'))
var jquerysrc = require('fs').readFileSync(require.resolve('jquery'))
var threesrc = require('fs').readFileSync(require.resolve('three'))
var find = require('../')

// Optimize.
for (var i = 0; i < 5; i++) find(acornsrc).properties

// Has very few undeclared identifiers
bench('acorn × 1', function (b) {
  b.start()
  find(acornsrc).properties
  b.end()
})
bench('acorn × 5', function (b) {
  b.start()
  for (var i = 0; i < 5; i++) find(acornsrc).properties
  b.end()
})

bench('lodash × 1', function (b) {
  b.start()
  find(lodashsrc).properties
  b.end()
})
bench('lodash × 5', function (b) {
  b.start()
  for (var i = 0; i < 5; i++) find(lodashsrc).properties
  b.end()
})

// Has more undeclared identifiers and properties
bench('jquery × 1', function (b) {
  b.start()
  find(jquerysrc).properties
  b.end()
})
bench('jquery × 5', function (b) {
  b.start()
  for (var i = 0; i < 5; i++) find(jquerysrc).properties
  b.end()
})

// is very large
bench('three × 1', function (b) {
  b.start()
  find(threesrc).identifiers
  b.end()
})
bench('three × 5', function (b) {
  b.start()
  for (var i = 0; i < 5; i++) find(threesrc).identifiers
  b.end()
})
