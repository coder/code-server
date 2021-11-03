var bench = require('nanobench')
var src = require('fs').readFileSync(require.resolve('acorn'))
var parse = require('acorn').parse
var astw = require('astw')
var eswalk = require('estree-walk')
var eswalker = require('estree-walker')
var dash = require('../')

bench('astw', function (b) {
  var ast = parse(src)
  b.start()
  var i = 0
  astw(ast)(function (node) { i++ })
  b.end('walked ' + i + ' nodes')
})

bench('estree-walk', function (b) {
  var ast = parse(src)
  b.start()
  var i = 0
  eswalk(ast, function (node) { i++ })
  b.end('walked ' + i + ' nodes')
})

bench('estree-walk steps', function (b) {
  var ast = parse(src)
  b.start()
  var i = 0
  for (var q = [ast], node; (node = q.pop()); eswalk.step(node, q)) {
    i++
  }
  b.end('walked ' + i + ' nodes')
})

bench('dash-ast', function (b) {
  var ast = parse(src)
  b.start()
  var i = 0
  dash(ast, function (node) { i++ })
  b.end('walked ' + i + ' nodes')
})

bench('dash-ast with .parent', function (b) {
  var ast = parse(src)
  b.start()
  var i = 0
  dash.withParent(ast, function (node) { i++ })
  b.end('walked ' + i + ' nodes')
})

bench('dash-ast with enter/leave', function (b) {
  var ast = parse(src)
  b.start()
  var i = 0
  var j = 0
  dash(ast, {
    enter: function (node) { i++ },
    leave: function (node) { j++ }
  })
  b.end('walked ' + [i, j] + ' nodes')
})

bench('estree-walker', function (b) {
  var ast = parse(src)
  b.start()
  var i = 0
  eswalker.walk(ast, {
    enter: function (node) { i++ }
  })
  b.end('walked ' + i + ' nodes')
})
