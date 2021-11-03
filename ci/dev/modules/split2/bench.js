'use strict'

var split = require('./')
var bench = require('fastbench')
var binarySplit = require('binary-split')
var fs = require('fs')

function benchSplit (cb) {
  fs.createReadStream('package.json')
    .pipe(split())
    .on('end', cb)
    .resume()
}

function benchBinarySplit (cb) {
  fs.createReadStream('package.json')
    .pipe(binarySplit())
    .on('end', cb)
    .resume()
}

var run = bench([
  benchSplit,
  benchBinarySplit
], 10000)

run(run)
