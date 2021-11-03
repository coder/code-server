var xtend = require('xtend')
var acorn = require('acorn-node')
var dash = require('dash-ast')
var getAssignedIdentifiers = require('get-assigned-identifiers')

function visitFunction (node, state, ancestors) {
  if (node.params.length > 0) {
    var idents = []
    for (var i = 0; i < node.params.length; i++) {
      var sub = getAssignedIdentifiers(node.params[i])
      for (var j = 0; j < sub.length; j++) idents.push(sub[j])
    }
    declareNames(node, idents)
  }
  if (node.type === 'FunctionDeclaration') {
    var parent = getScopeNode(ancestors, 'const')
    declareNames(parent, [node.id])
  } else if (node.type === 'FunctionExpression' && node.id) {
    declareNames(node, [node.id])
  }
}

var scopeVisitor = {
  VariableDeclaration: function (node, state, ancestors) {
    var parent = getScopeNode(ancestors, node.kind)
    for (var i = 0; i < node.declarations.length; i++) {
      declareNames(parent, getAssignedIdentifiers(node.declarations[i].id))
    }
  },
  FunctionExpression: visitFunction,
  FunctionDeclaration: visitFunction,
  ArrowFunctionExpression: visitFunction,
  ClassDeclaration: function (node, state, ancestors) {
    var parent = getScopeNode(ancestors, 'const')
    if (node.id) {
      declareNames(parent, [node.id])
    }
  },
  ImportDeclaration: function (node, state, ancestors) {
    declareNames(ancestors[0] /* root */, getAssignedIdentifiers(node))
  },
  CatchClause: function (node) {
    if (node.param) declareNames(node, [node.param])
  }
}

var bindingVisitor = {
  Identifier: function (node, state, ancestors) {
    if (!state.identifiers) return
    var parent = ancestors[ancestors.length - 1]
    if (parent.type === 'MemberExpression' && parent.property === node) return
    if (parent.type === 'Property' && !parent.computed && parent.key === node) return
    if (parent.type === 'MethodDefinition' && !parent.computed && parent.key === node) return
    if (parent.type === 'LabeledStatement' && parent.label === node) return
    if (!has(state.undeclared, node.name)) {
      for (var i = ancestors.length - 1; i >= 0; i--) {
        if (ancestors[i]._names !== undefined && has(ancestors[i]._names, node.name)) {
          return
        }
      }

      state.undeclared[node.name] = true
    }

    if (state.wildcard &&
        !(parent.type === 'MemberExpression' && parent.object === node) &&
        !(parent.type === 'VariableDeclarator' && parent.id === node) &&
        !(parent.type === 'AssignmentExpression' && parent.left === node)) {
      state.undeclaredProps[node.name + '.*'] = true
    }
  },
  MemberExpression: function (node, state) {
    if (!state.properties) return
    if (node.object.type === 'Identifier' && has(state.undeclared, node.object.name)) {
      var prop = !node.computed && node.property.type === 'Identifier'
        ? node.property.name
        : node.computed && node.property.type === 'Literal'
          ? node.property.value
          : null
      if (prop) state.undeclaredProps[node.object.name + '.' + prop] = true
    }
  }
}

module.exports = function findUndeclared (src, opts) {
  opts = xtend({
    identifiers: true,
    properties: true,
    wildcard: false
  }, opts)

  var state = {
    undeclared: {},
    undeclaredProps: {},
    identifiers: opts.identifiers,
    properties: opts.properties,
    wildcard: opts.wildcard
  }

  // Parse if `src` is not already an AST.
  var ast = typeof src === 'object' && src !== null && typeof src.type === 'string'
    ? src
    : acorn.parse(src)

  var parents = []
  dash(ast, {
    enter: function (node, parent) {
      if (parent) parents.push(parent)
      var visit = scopeVisitor[node.type]
      if (visit) visit(node, state, parents)
    },
    leave: function (node, parent) {
      var visit = bindingVisitor[node.type]
      if (visit) visit(node, state, parents)
      if (parent) parents.pop()
    }
  })

  return {
    identifiers: Object.keys(state.undeclared),
    properties: Object.keys(state.undeclaredProps)
  }
}

function getScopeNode (parents, kind) {
  for (var i = parents.length - 1; i >= 0; i--) {
    if (parents[i].type === 'FunctionDeclaration' || parents[i].type === 'FunctionExpression' ||
        parents[i].type === 'ArrowFunctionExpression' || parents[i].type === 'Program') {
      return parents[i]
    }
    if (kind !== 'var' && parents[i].type === 'BlockStatement') {
      return parents[i]
    }
  }
}

function declareNames (node, names) {
  if (node._names === undefined) {
    node._names = Object.create(null)
  }
  for (var i = 0; i < names.length; i++) {
    node._names[names[i].name] = true
  }
}

function has (obj, name) { return Object.prototype.hasOwnProperty.call(obj, name) }
