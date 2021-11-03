'use strict'

var fence = require('./fence')

module.exports = create

function create(matter) {
  var name = matter.type + 'FrontMatter'
  var open = fence(matter, 'open')
  var close = fence(matter, 'close')
  var newline = '\n'
  var anywhere = matter.anywhere

  frontmatter.displayName = name
  frontmatter.onlyAtStart = typeof anywhere === 'boolean' ? !anywhere : true

  return [name, frontmatter]

  function frontmatter(eat, value, silent) {
    var index = open.length
    var offset

    if (value.slice(0, index) !== open || value.charAt(index) !== newline) {
      return
    }

    offset = value.indexOf(close, index)

    while (offset !== -1 && value.charAt(offset - 1) !== newline) {
      index = offset + close.length
      offset = value.indexOf(close, index)
    }

    if (offset !== -1) {
      /* istanbul ignore if - never used (yet) */
      if (silent) {
        return true
      }

      return eat(value.slice(0, offset + close.length))({
        type: matter.type,
        value: value.slice(open.length + 1, offset - 1)
      })
    }
  }
}
