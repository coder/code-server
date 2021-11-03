var tape = require('tape')
var Buffer = require('safe-buffer').Buffer
var shasum = require('..')

tape('strings', function (t) {
  t.plan(3)
  t.strictEqual(shasum('abc'), 'a9993e364706816aba3e25717850c26c9cd0d89d')
  t.strictEqual(shasum('abce'), '0a431a7631cabf6b11b984a943127b5e0aa9d687')
  t.strictEqual(shasum('ab\xff'), 'ba5142a8207bd61baddf325088732e71cbfe8eb6')
})

tape('json values', function (t) {
  t.plan(2)
  t.strictEqual(shasum({}), 'bf21a9e8fbc5a3846fb05b4fa0859e0917b2202f')
  t.strictEqual(shasum([]), '97d170e1550eee4afc0af065b78cda302a97674c')
})

tape('buffers', function (t) {
  t.plan(2)
  t.strictEqual(shasum(Buffer.from('abc')),
    'a9993e364706816aba3e25717850c26c9cd0d89d')
  t.strictEqual(shasum(Buffer.from('ab\xff').toString()),
    'ba5142a8207bd61baddf325088732e71cbfe8eb6')
})

tape('circular json', function (t) {
  t.plan(1)
  var a = { b: 1 }
  a.a = a
  t.strictEqual(shasum(a), 'a22ca7ba0fe6144501fe50d9c8a9ba889057db3b')
})

tape('stability', function (t) {
  t.plan(4)
  t.strictEqual(shasum({ a: 1, b: 2, c: 3 }), shasum({ c: 3, b: 2, a: 1 }))
  t.strictEqual(shasum({ a: 1, b: 2, c: 3 }), shasum({ c: 3, b: 2, a: 1 }))
  t.strictEqual(shasum({ a: 1, b: [2, 3], c: 4 }), shasum({ c: 4, b: [2, 3], a: 1 }))
  t.strictEqual(shasum({ a: 1, b: [2, { c: 3, d: 4 }], e: 5 }), shasum({ e: 5, b: [2, { d: 4, c: 3 }], a: 1 }))
})
