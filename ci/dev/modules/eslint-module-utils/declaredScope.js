'use strict';
exports.__esModule = true;

exports.default = function declaredScope(context, name) {
  const references = context.getScope().references;
  const reference = references.find(x => x.identifier.name === name);
  if (!reference) return undefined;
  return reference.resolved.scope.type;
};
