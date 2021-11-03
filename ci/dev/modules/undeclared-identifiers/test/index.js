var test = require('tape')
var acorn = require('acorn-node')
var find = require('../')

test('undeclared variables', function (t) {
  t.deepEqual(find(`
    var a, b
    a, b, c
  `), {
    identifiers: ['c'],
    properties: []
  })
  t.end()
})

test('pass in a parsed ast', function (t) {
  t.deepEqual(find(acorn.parse(`
    var a, b
    a, b, c
  `)), {
    identifiers: ['c'],
    properties: []
  })
  t.end()
})

test('undeclared properties', function (t) {
  t.deepEqual(find(`
    var a, b
    a, b, c, d.e
  `), {
    identifiers: ['c', 'd'],
    properties: ['d.e']
  })
  t.end()
})

test('wildcard use of undeclared name', function (t) {
  t.deepEqual(find(`
    function func () {}
    new A()
    A.from()
    func(b)
    C.from()
  `, { wildcard: true }), {
    identifiers: ['A', 'b', 'C'],
    properties: ['A.*', 'A.from', 'b.*', 'C.from']
  })
  t.end()
})

test('wildcard use of undeclared name (different order)', function (t) {
  t.deepEqual(find(`
    A.from()
    new A()
  `, { wildcard: true }), {
    identifiers: ['A'],
    properties: ['A.from', 'A.*']
  })
  t.end()
})

test('function names', function (t) {
  t.deepEqual(find(`
    function x () {
      return x
    }
    x()
  `), {
    identifiers: [],
    properties: []
  })
  t.deepEqual(find(`
    function x () {
      return x
    }
    y()
  `), {
    identifiers: ['y'],
    properties: []
  })
  t.end()
})

test('class names', function (t) {
  t.deepEqual(find(`
    class X {}
    new X()
  `), {
    identifiers: [],
    properties: []
  })
  t.deepEqual(find(`
    class X extends Y {}
    new X()
  `), {
    identifiers: ['Y'],
    properties: []
  })
  t.deepEqual(find(`
    class Y {}
    class X extends Y {}
    new X()
  `), {
    identifiers: [],
    properties: []
  })
  t.end()
})

test('class methods', function (t) {
  t.deepEqual(find(`
    class X {
      constructor() { u }
      bar() { v }
      static foo() { w }
    }
  `), {
    identifiers: ['u', 'v', 'w'],
    properties: []
  })
  t.end()
})

test('super', function (t) {
  t.deepEqual(find(`
    class X extends Y {
      constructor() { super() }
    }
  `), {
    identifiers: ['Y'],
    properties: []
  })
  t.deepEqual(find(`
    class X {
      foo() { super.foo }
    }
  `), {
    identifiers: [],
    properties: []
  })
  t.end()
})

test('scope', function (t) {
  t.deepEqual(find(`
    function y () {
      function x () {
        return x
      }
    }
    x(y(x.y))
  `), {
    identifiers: ['x'],
    properties: ['x.y']
  })
  t.end()
})

test('block scope', function (t) {
  t.deepEqual(find(`
    var x
    { var y; let z }
    x, y, z
  `), {
    identifiers: ['z'],
    properties: []
  })
  t.end()
})

test('function parameters', function (t) {
  t.deepEqual(find(`
    function a (a1, a2) { a, a1, a2, a3 }
    ;(function b (b1, b2) { b, b1, b2, b3 })
    ;((c1, c2) => { c1, c2, c3 })
  `), {
    identifiers: ['a3', 'b3', 'c3'],
    properties: []
  })
  t.deepEqual(find(`
    function a (a1, a2) { }
    a, a1, a2
  `), {
    identifiers: ['a1', 'a2'],
    properties: []
  })
  t.end()
})

test('assignment', function (t) {
  t.deepEqual(find(`
    var a
    b = 2
    b.c = 3
  `), {
    identifiers: ['b'],
    properties: ['b.c']
  })
  t.end()
})

test('catch', function (t) {
  t.deepEqual(find(`
    try { var a } catch (err) { err }
    try { let b } catch (orr) { orr }
    a, b
  `), {
    identifiers: ['b'],
    properties: []
  })
  t.end()
})

test('object prototype names', function (t) {
  t.deepEqual(find(`
    var propertyIsEnumerable, hasOwnProperty
    isPrototypeOf
  `), {
    identifiers: ['isPrototypeOf'],
    properties: []
  })
  t.end()
})

test('labels', function (t) {
  t.deepEqual(find(`
    a: a;
    b: a;
    c: a;
  `), {
    identifiers: ['a'],
    properties: []
  })
  t.end()
})

test('property keys', function (t) {
  t.deepEqual(find(`
    ({ a: a,
    b: a, [d]: a,
    c: a, })
  `), {
    identifiers: ['a', 'd'],
    properties: []
  })
  t.end()
})

test('string property access', function (t) {
  t.deepEqual(find(`
    Buffer["isBuffer"]
  `), {
    identifiers: ['Buffer'],
    properties: ['Buffer.isBuffer']
  })
  t.end()
})
