'use strict'

var xtend = require('xtend')
var matters = require('./lib/matters')
var parse = require('./lib/parse')
var compile = require('./lib/compile')

module.exports = frontmatter

function frontmatter(options) {
  var parser = this.Parser
  var compiler = this.Compiler
  var config = matters(options || ['yaml'])

  if (isRemarkParser(parser)) {
    attachParser(parser, config)
  }

  if (isRemarkCompiler(compiler)) {
    attachCompiler(compiler, config)
  }
}

function attachParser(parser, matters) {
  var proto = parser.prototype
  var tokenizers = wrap(parse, matters)
  var names = []
  var key

  for (key in tokenizers) {
    names.push(key)
  }

  proto.blockMethods = names.concat(proto.blockMethods)
  proto.blockTokenizers = xtend(tokenizers, proto.blockTokenizers)
}

function attachCompiler(compiler, matters) {
  var proto = compiler.prototype
  proto.visitors = xtend(wrap(compile, matters), proto.visitors)
}

function wrap(func, matters) {
  var result = {}
  var length = matters.length
  var index = -1
  var tuple

  while (++index < length) {
    tuple = func(matters[index])
    result[tuple[0]] = tuple[1]
  }

  return result
}

function isRemarkParser(parser) {
  return Boolean(parser && parser.prototype && parser.prototype.blockTokenizers)
}

function isRemarkCompiler(compiler) {
  return Boolean(compiler && compiler.prototype && compiler.prototype.visitors)
}
