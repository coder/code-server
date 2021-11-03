'use strict'

let { cyan, gray, green, yellow, magenta } = require('colorette')

let tokenizer = require('./tokenize')

let Input

function registerInput(dependant) {
  Input = dependant
}

const HIGHLIGHT_THEME = {
  'brackets': cyan,
  'at-word': cyan,
  'comment': gray,
  'string': green,
  'class': yellow,
  'hash': magenta,
  'call': cyan,
  '(': cyan,
  ')': cyan,
  '{': yellow,
  '}': yellow,
  '[': yellow,
  ']': yellow,
  ':': yellow,
  ';': yellow
}

function getTokenType([type, value], processor) {
  if (type === 'word') {
    if (value[0] === '.') {
      return 'class'
    }
    if (value[0] === '#') {
      return 'hash'
    }
  }

  if (!processor.endOfFile()) {
    let next = processor.nextToken()
    processor.back(next)
    if (next[0] === 'brackets' || next[0] === '(') return 'call'
  }

  return type
}

function terminalHighlight(css) {
  let processor = tokenizer(new Input(css), { ignoreErrors: true })
  let result = ''
  while (!processor.endOfFile()) {
    let token = processor.nextToken()
    let color = HIGHLIGHT_THEME[getTokenType(token, processor)]
    if (color) {
      result += token[1]
        .split(/\r?\n/)
        .map(i => color(i))
        .join('\n')
    } else {
      result += token[1]
    }
  }
  return result
}

terminalHighlight.registerInput = registerInput

module.exports = terminalHighlight
