'use strict'

const test = require('tape')
const buildQueue = require('../').promise
const { promisify } = require('util')
const sleep = promisify(setTimeout)

test('concurrency', function (t) {
  t.plan(2)
  t.throws(buildQueue.bind(null, worker, 0))
  t.doesNotThrow(buildQueue.bind(null, worker, 1))

  async function worker (arg) {
    return true
  }
})

test('worker execution', async function (t) {
  var queue = buildQueue(worker, 1)

  const result = await queue.push(42)

  t.equal(result, true, 'result matches')

  async function worker (arg) {
    t.equal(arg, 42)
    return true
  }
})

test('limit', async function (t) {
  var queue = buildQueue(worker, 1)

  const [res1, res2] = await Promise.all([queue.push(10), queue.push(0)])
  t.equal(res1, 10, 'the result matches')
  t.equal(res2, 0, 'the result matches')

  async function worker (arg) {
    await sleep(arg)
    return arg
  }
})

test('multiple executions', async function (t) {
  var queue = buildQueue(worker, 1)
  var toExec = [1, 2, 3, 4, 5]
  var expected = ['a', 'b', 'c', 'd', 'e']
  var count = 0

  await Promise.all(toExec.map(async function (task, i) {
    const result = await queue.push(task)
    t.equal(result, expected[i], 'the result matches')
  }))

  async function worker (arg) {
    t.equal(arg, toExec[count], 'arg matches')
    return expected[count++]
  }
})

test('set this', async function (t) {
  t.plan(1)
  var that = {}
  var queue = buildQueue(that, worker, 1)

  await queue.push(42)

  async function worker (arg) {
    t.equal(this, that, 'this matches')
  }
})

test('unshift', async function (t) {
  var queue = buildQueue(worker, 1)
  var expected = [1, 2, 3, 4]

  await Promise.all([
    queue.push(1),
    queue.push(4),
    queue.unshift(3),
    queue.unshift(2)
  ])

  t.is(expected.length, 0)

  async function worker (arg) {
    t.equal(expected.shift(), arg, 'tasks come in order')
  }
})

test('push with worker throwing error', async function (t) {
  t.plan(5)
  var q = buildQueue(async function (task, cb) {
    throw new Error('test error')
  }, 1)
  q.error(function (err, task) {
    t.ok(err instanceof Error, 'global error handler should catch the error')
    t.match(err.message, /test error/, 'error message should be "test error"')
    t.equal(task, 42, 'The task executed should be passed')
  })
  try {
    await q.push(42)
  } catch (err) {
    t.ok(err instanceof Error, 'push callback should catch the error')
    t.match(err.message, /test error/, 'error message should be "test error"')
  }
})

test('unshift with worker throwing error', async function (t) {
  t.plan(2)
  var q = buildQueue(async function (task, cb) {
    throw new Error('test error')
  }, 1)
  try {
    await q.unshift(42)
  } catch (err) {
    t.ok(err instanceof Error, 'push callback should catch the error')
    t.match(err.message, /test error/, 'error message should be "test error"')
  }
})
