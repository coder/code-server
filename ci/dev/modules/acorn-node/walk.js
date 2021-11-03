var xtend = require('xtend')
var walk = require('acorn-walk')

var base = xtend(walk.base)
base.Import = function () {}

function simple (node, visitors, baseVisitor, state, override) {
  return walk.simple(node, visitors, baseVisitor || base, state, override)
}

function ancestor (node, visitors, baseVisitor, state) {
  return walk.ancestor(node, visitors, baseVisitor || base, state)
}

function recursive (node, state, funcs, baseVisitor, override) {
  return walk.recursive(node, state, funcs, baseVisitor || base, override)
}

function full (node, callback, baseVisitor, state, override) {
  return walk.full(node, callback, baseVisitor || base, state, override)
}

function fullAncestor (node, callback, baseVisitor, state) {
  return walk.fullAncestor(node, callback, baseVisitor || base, state)
}

function findNodeAt (node, start, end, test, baseVisitor, state) {
  return walk.findNodeAt(node, start, end, test, baseVisitor || base, state)
}

function findNodeAround (node, pos, test, baseVisitor, state) {
  return walk.findNodeAround(node, pos, test, baseVisitor || base, state)
}

function findNodeAfter (node, pos, test, baseVisitor, state) {
  return walk.findNodeAfter(node, pos, test, baseVisitor || base, state)
}

function findNodeBefore (node, pos, test, baseVisitor, state) {
  return walk.findNodeBefore(node, pos, test, baseVisitor || base, state)
}

function make (funcs, baseVisitor) {
  return walk.make(funcs, baseVisitor || base)
}

exports.simple = simple
exports.ancestor = ancestor
exports.recursive = recursive
exports.full = full
exports.fullAncestor = fullAncestor
exports.findNodeAt = findNodeAt
exports.findNodeAround = findNodeAround
exports.findNodeAfter = findNodeAfter
exports.findNodeBefore = findNodeBefore
exports.make = make
exports.base = base
