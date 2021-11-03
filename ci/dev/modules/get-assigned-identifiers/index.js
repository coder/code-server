var assert = require('assert')

/**
 * Get a list of all identifiers that are initialised by this (possibly destructuring)
 * node.
 *
 * eg with input:
 *
 * var { a: [b, ...c], d } = xyz
 *
 * this returns the nodes for 'b', 'c', and 'd'
 */
module.exports = function getAssignedIdentifiers (node, identifiers) {
  assert.equal(typeof node, 'object', 'get-assigned-identifiers: node must be object')
  assert.equal(typeof node.type, 'string', 'get-assigned-identifiers: node must have a type')

  identifiers = identifiers || []

  if (node.type === 'ImportDeclaration') {
    node.specifiers.forEach(function (el) {
      getAssignedIdentifiers(el, identifiers)
    })
  }

  if (node.type === 'ImportDefaultSpecifier' || node.type === 'ImportNamespaceSpecifier' || node.type === 'ImportSpecifier') {
    node = node.local
  }

  if (node.type === 'RestElement') {
    node = node.argument
  }

  if (node.type === 'ArrayPattern') {
    node.elements.forEach(function (el) {
      // `el` might be `null` in case of `[x,,y] = whatever`
      if (el) {
        getAssignedIdentifiers(el, identifiers)
      }
    })
  }

  if (node.type === 'ObjectPattern') {
    node.properties.forEach(function (prop) {
      if (prop.type === 'Property') {
        getAssignedIdentifiers(prop.value, identifiers)
      } else if (prop.type === 'RestElement') {
        getAssignedIdentifiers(prop, identifiers)
      }
    })
  }

  if (node.type === 'Identifier') {
    identifiers.push(node)
  }

  return identifiers
}
