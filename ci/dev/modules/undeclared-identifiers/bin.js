#!/usr/bin/env node

var concat = require('simple-concat')
var undeclared = require('./')

if (arg('--help') || arg('-h')) {
  console.log('usage: undeclared-identifiers [--identifiers] [--properties] < source.js')
  process.exit(0)
}

concat(process.stdin, function (err, src) {
  if (err) throw err

  var r = undeclared(src)
  var i = arg('--identifiers') || arg('-i')
  var p = arg('--properties') || arg('-p')

  if (!i && !p) i = p = true

  if (i) r.identifiers.forEach(log)
  if (p) r.properties.forEach(log)
})

function arg (s) {
  return process.argv.indexOf(s) !== -1
}
function log (n) {
  console.log(n)
}
