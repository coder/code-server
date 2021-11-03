var test = require('tape')
var src = require('fs').readFileSync(require.resolve('acorn'))
var parse = require('acorn').parse
var dash = require('../')

var NUM_NODES = 25426

test('dash-ast', function (t) {
  var ast = parse(src)
  var i = 0
  dash(ast, function (node) { i++ })
  t.equal(i, NUM_NODES)
  t.comment('walked ' + i + ' nodes')
  t.end()
})

test('dash-ast with .parent', function (t) {
  var ast = parse(src)
  var i = 0
  dash.withParent(ast, function (node) { i++ })
  t.equal(i, NUM_NODES)
  t.comment('walked ' + i + ' nodes')
  t.end()
})

test('dash-ast with enter/leave', function (t) {
  var ast = parse(src)
  var i = 0
  var j = 0
  dash(ast, {
    enter: function (node) { i++ },
    leave: function (node) { j++ }
  })
  t.equal(i, NUM_NODES)
  t.equal(j, NUM_NODES)
  t.comment('walked ' + [i, j] + ' nodes')
  t.end()
})
