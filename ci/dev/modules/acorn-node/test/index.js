var test = require('tape')
var acorn = require('../')
var walk = require('../walk')
var baseAcorn = require('acorn')

test('parses object spread syntax', function (t) {
  var ast = acorn.parse('var a = { ...b }')
  t.equal(ast.body[0].declarations[0].init.type, 'ObjectExpression')
  t.equal(ast.body[0].declarations[0].init.properties[0].type, 'SpreadElement')

  ast = acorn.parse('function a ({ ...b }) {}')
  t.equal(ast.body[0].params[0].type, 'ObjectPattern')
  t.equal(ast.body[0].params[0].properties[0].type, 'RestElement')

  t.end()
})

test('does not change main acorn module', function (t) {
  t.throws(function () {
    baseAcorn.parse('var a = 10n')
  })
  t.end()
})

test('tokenizes object spread syntax', function (t) {
  var tokenizer = acorn.tokenizer('var a = { ...b }')

  t.doesNotThrow(function (t) {
    while (tokenizer.getToken().type !== acorn.tokTypes.eof) {}
  })
  t.end()
})

test('allows hashbangs by default', function (t) {
  t.doesNotThrow(function () {
    acorn.parse('#!/usr/bin/env node\nconsole.log("ok")')
  })
  t.end()
})

test('allows top level return by default', function (t) {
  t.doesNotThrow(function () {
    acorn.parse('console.log("ok"); return; console.log("not ok")')
  })
  t.end()
})

test('supports async generators', function (t) {
  t.doesNotThrow(function () {
    acorn.parse('async function* a () { await x; yield 1 }')
  })
  t.end()
})

test('supports async iteration', function (t) {
  t.doesNotThrow(function () {
    acorn.parse('async function l (y) { for await (const x of y) {} }')
  })
  t.end()
})

test('supports optional catch', function (t) {
  t.doesNotThrow(function () {
    acorn.parse('try { throw null } catch {}')
  })
  t.end()
})

test('supports bigint', function (t) {
  t.doesNotThrow(function () {
    acorn.parse('50n ** 50n')
  })
  t.end()
})

test('supports numeric separators', function (t) {
  t.doesNotThrow(function () {
    acorn.parse('50_000_000n ** 1n')
  })
  t.end()
})

test('supports import.meta with sourceType: module', function (t) {
  t.doesNotThrow(function () {
    acorn.parse('console.log(import.meta.url)', { sourceType: 'module' })
  })
  t.end()
})

test('supports dynamic import() with sourceType: module', function (t) {
  t.doesNotThrow(function () {
    acorn.parse('import("./whatever.mjs")', { sourceType: 'module' })
  })
  t.end()
})

test('supports dynamic import() with sourceType: script', function (t) {
  t.doesNotThrow(function () {
    acorn.parse('import("./whatever.mjs")', { sourceType: 'script' })
  })
  t.end()
})

test('supports class instance properties', function (t) {
  t.doesNotThrow(function () {
    acorn.parse('class X { x = y }', { sourceType: 'script' })
  })
  t.end()
})

test('supports private class instance properties', function (t) {
  t.doesNotThrow(function () {
    acorn.parse('class X { #x = y }', { sourceType: 'script' })
  })
  t.end()
})

test('supports class static properties', function (t) {
  t.doesNotThrow(function () {
    acorn.parse('class X { static x = y }', { sourceType: 'script' })
  })
  t.end()
})

test('supports private class static properties', function (t) {
  t.doesNotThrow(function () {
    acorn.parse('class X { static #x = y }', { sourceType: 'script' })
  })
  t.end()
})

test('supports namespace export syntax with sourceType: module', function (t) {
  t.doesNotThrow(function () {
    acorn.parse('export * as x from "./x.mjs";', { sourceType: 'module' })
  })
  t.end()
})

test('walk supports plugin syntax', function (t) {
  var ast = acorn.parse(
    'async function* a() { try { await import(xyz); } catch { for await (x of null) {} } yield import.meta.url }',
    { sourceType: 'module' }
  )
  t.plan(2)
  walk.simple(ast, {
    Import: function () {
      t.pass('import()')
    },
    MetaProperty: function () {
      t.pass('import.meta')
    }
  })
  t.end()
})
