'use strict'

var max = 1000000
var fastqueue = require('./')(worker, 1)
var { promisify } = require('util')
var immediate = promisify(setImmediate)
var qPromise = require('./').promise(immediate, 1)
var async = require('async')
var neo = require('neo-async')
var asyncqueue = async.queue(worker, 1)
var neoqueue = neo.queue(worker, 1)

function bench (func, done) {
  var key = max + '*' + func.name
  var count = -1

  console.time(key)
  end()

  function end () {
    if (++count < max) {
      func(end)
    } else {
      console.timeEnd(key)
      if (done) {
        done()
      }
    }
  }
}

function benchFastQ (done) {
  fastqueue.push(42, done)
}

function benchAsyncQueue (done) {
  asyncqueue.push(42, done)
}

function benchNeoQueue (done) {
  neoqueue.push(42, done)
}

function worker (arg, cb) {
  setImmediate(cb)
}

function benchSetImmediate (cb) {
  worker(42, cb)
}

function benchFastQPromise (done) {
  qPromise.push(42).then(function () { done() }, done)
}

function runBench (done) {
  async.eachSeries([
    benchSetImmediate,
    benchFastQ,
    benchNeoQueue,
    benchAsyncQueue,
    benchFastQPromise
  ], bench, done)
}

runBench(runBench)
