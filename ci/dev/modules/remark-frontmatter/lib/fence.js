'use strict'

module.exports = fence

function fence(matter, prop) {
  var marker

  if (matter.marker) {
    marker = pick(matter.marker, prop)
    return marker + marker + marker
  }

  return pick(matter.fence, prop)
}

function pick(schema, prop) {
  return typeof schema === 'string' ? schema : schema[prop]
}
