'use strict'

var fence = require('./fence')

module.exports = create

function create(matter) {
  var type = matter.type
  var open = fence(matter, 'open')
  var close = fence(matter, 'close')

  frontmatter.displayName = type + 'FrontMatter'

  return [type, frontmatter]

  function frontmatter(node) {
    return open + (node.value ? '\n' + node.value : '') + '\n' + close
  }
}
