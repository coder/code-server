'use strict';




var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _toConsumableArray(arr) {if (Array.isArray(arr)) {for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];return arr2;} else {return Array.from(arr);}} /**
                                                                                                                                                                                                                                                                                                                                                                             * @fileoverview Rule to disallow namespace import
                                                                                                                                                                                                                                                                                                                                                                             * @author Radek Benkel
                                                                                                                                                                                                                                                                                                                                                                             */ //------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-namespace') },

    fixable: 'code',
    schema: [] },


  create: function (context) {
    return {
      'ImportNamespaceSpecifier': function (node) {
        const scopeVariables = context.getScope().variables;
        const namespaceVariable = scopeVariables.find(variable =>
        variable.defs[0].node === node);

        const namespaceReferences = namespaceVariable.references;
        const namespaceIdentifiers = namespaceReferences.map(reference => reference.identifier);
        const canFix = namespaceIdentifiers.length > 0 && !usesNamespaceAsObject(namespaceIdentifiers);

        context.report({
          node,
          message: `Unexpected namespace import.`,
          fix: canFix && (fixer => {
            const scopeManager = context.getSourceCode().scopeManager;
            const fixes = [];

            // Pass 1: Collect variable names that are already in scope for each reference we want
            // to transform, so that we can be sure that we choose non-conflicting import names
            const importNameConflicts = {};
            namespaceIdentifiers.forEach(identifier => {
              const parent = identifier.parent;
              if (parent && parent.type === 'MemberExpression') {
                const importName = getMemberPropertyName(parent);
                const localConflicts = getVariableNamesInScope(scopeManager, parent);
                if (!importNameConflicts[importName]) {
                  importNameConflicts[importName] = localConflicts;
                } else {
                  localConflicts.forEach(c => importNameConflicts[importName].add(c));
                }
              }
            });

            // Choose new names for each import
            const importNames = Object.keys(importNameConflicts);
            const importLocalNames = generateLocalNames(
            importNames,
            importNameConflicts,
            namespaceVariable.name);


            // Replace the ImportNamespaceSpecifier with a list of ImportSpecifiers
            const namedImportSpecifiers = importNames.map(importName =>
            importName === importLocalNames[importName] ?
            importName :
            `${importName} as ${importLocalNames[importName]}`);

            fixes.push(fixer.replaceText(node, `{ ${namedImportSpecifiers.join(', ')} }`));

            // Pass 2: Replace references to the namespace with references to the named imports
            namespaceIdentifiers.forEach(identifier => {
              const parent = identifier.parent;
              if (parent && parent.type === 'MemberExpression') {
                const importName = getMemberPropertyName(parent);
                fixes.push(fixer.replaceText(parent, importLocalNames[importName]));
              }
            });

            return fixes;
          }) });

      } };

  } };


/**
        * @param {Identifier[]} namespaceIdentifiers
        * @returns {boolean} `true` if the namespace variable is more than just a glorified constant
        */
function usesNamespaceAsObject(namespaceIdentifiers) {
  return !namespaceIdentifiers.every(identifier => {
    const parent = identifier.parent;

    // `namespace.x` or `namespace['x']`
    return (
      parent && parent.type === 'MemberExpression' && (
      parent.property.type === 'Identifier' || parent.property.type === 'Literal'));

  });
}

/**
   * @param {MemberExpression} memberExpression
   * @returns {string} the name of the member in the object expression, e.g. the `x` in `namespace.x`
   */
function getMemberPropertyName(memberExpression) {
  return memberExpression.property.type === 'Identifier' ?
  memberExpression.property.name :
  memberExpression.property.value;
}

/**
   * @param {ScopeManager} scopeManager
   * @param {ASTNode} node
   * @return {Set<string>}
   */
function getVariableNamesInScope(scopeManager, node) {
  let currentNode = node;
  let scope = scopeManager.acquire(currentNode);
  while (scope == null) {
    currentNode = currentNode.parent;
    scope = scopeManager.acquire(currentNode, true);
  }
  return new Set([].concat(_toConsumableArray(
  scope.variables.map(variable => variable.name)), _toConsumableArray(
  scope.upper.variables.map(variable => variable.name))));

}

/**
   *
   * @param {*} names
   * @param {*} nameConflicts
   * @param {*} namespaceName
   */
function generateLocalNames(names, nameConflicts, namespaceName) {
  const localNames = {};
  names.forEach(name => {
    let localName;
    if (!nameConflicts[name].has(name)) {
      localName = name;
    } else if (!nameConflicts[name].has(`${namespaceName}_${name}`)) {
      localName = `${namespaceName}_${name}`;
    } else {
      for (let i = 1; i < Infinity; i++) {
        if (!nameConflicts[name].has(`${namespaceName}_${name}_${i}`)) {
          localName = `${namespaceName}_${name}_${i}`;
          break;
        }
      }
    }
    localNames[name] = localName;
  });
  return localNames;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJ0eXBlIiwiZG9jcyIsInVybCIsImZpeGFibGUiLCJzY2hlbWEiLCJjcmVhdGUiLCJjb250ZXh0Iiwibm9kZSIsInNjb3BlVmFyaWFibGVzIiwiZ2V0U2NvcGUiLCJ2YXJpYWJsZXMiLCJuYW1lc3BhY2VWYXJpYWJsZSIsImZpbmQiLCJ2YXJpYWJsZSIsImRlZnMiLCJuYW1lc3BhY2VSZWZlcmVuY2VzIiwicmVmZXJlbmNlcyIsIm5hbWVzcGFjZUlkZW50aWZpZXJzIiwibWFwIiwicmVmZXJlbmNlIiwiaWRlbnRpZmllciIsImNhbkZpeCIsImxlbmd0aCIsInVzZXNOYW1lc3BhY2VBc09iamVjdCIsInJlcG9ydCIsIm1lc3NhZ2UiLCJmaXgiLCJmaXhlciIsInNjb3BlTWFuYWdlciIsImdldFNvdXJjZUNvZGUiLCJmaXhlcyIsImltcG9ydE5hbWVDb25mbGljdHMiLCJmb3JFYWNoIiwicGFyZW50IiwiaW1wb3J0TmFtZSIsImdldE1lbWJlclByb3BlcnR5TmFtZSIsImxvY2FsQ29uZmxpY3RzIiwiZ2V0VmFyaWFibGVOYW1lc0luU2NvcGUiLCJjIiwiYWRkIiwiaW1wb3J0TmFtZXMiLCJPYmplY3QiLCJrZXlzIiwiaW1wb3J0TG9jYWxOYW1lcyIsImdlbmVyYXRlTG9jYWxOYW1lcyIsIm5hbWUiLCJuYW1lZEltcG9ydFNwZWNpZmllcnMiLCJwdXNoIiwicmVwbGFjZVRleHQiLCJqb2luIiwiZXZlcnkiLCJwcm9wZXJ0eSIsIm1lbWJlckV4cHJlc3Npb24iLCJ2YWx1ZSIsImN1cnJlbnROb2RlIiwic2NvcGUiLCJhY3F1aXJlIiwiU2V0IiwidXBwZXIiLCJuYW1lcyIsIm5hbWVDb25mbGljdHMiLCJuYW1lc3BhY2VOYW1lIiwibG9jYWxOYW1lcyIsImxvY2FsTmFtZSIsImhhcyIsImkiLCJJbmZpbml0eSJdLCJtYXBwaW5ncyI6Ijs7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QVosQ0FBc0JRLEdBQXRCLENBQTBCTCxZQUFZQSxTQUFTZ0MsSUFBL0MsQ0FGRSxHQUFQOztBQUlEOztBQUVEOzs7Ozs7QUFNQSxTQUFTRCxrQkFBVCxDQUE0QmUsS0FBNUIsRUFBbUNDLGFBQW5DLEVBQWtEQyxhQUFsRCxFQUFpRTtBQUMvRCxRQUFNQyxhQUFhLEVBQW5CO0FBQ0FILFFBQU0zQixPQUFOLENBQWVhLElBQUQsSUFBVTtBQUN0QixRQUFJa0IsU0FBSjtBQUNBLFFBQUksQ0FBQ0gsY0FBY2YsSUFBZCxFQUFvQm1CLEdBQXBCLENBQXdCbkIsSUFBeEIsQ0FBTCxFQUFvQztBQUNsQ2tCLGtCQUFZbEIsSUFBWjtBQUNELEtBRkQsTUFFTyxJQUFJLENBQUNlLGNBQWNmLElBQWQsRUFBb0JtQixHQUFwQixDQUF5QixHQUFFSCxhQUFjLElBQUdoQixJQUFLLEVBQWpELENBQUwsRUFBMEQ7QUFDL0RrQixrQkFBYSxHQUFFRixhQUFjLElBQUdoQixJQUFLLEVBQXJDO0FBQ0QsS0FGTSxNQUVBO0FBQ0wsV0FBSyxJQUFJb0IsSUFBSSxDQUFiLEVBQWdCQSxJQUFJQyxRQUFwQixFQUE4QkQsR0FBOUIsRUFBbUM7QUFDakMsWUFBSSxDQUFDTCxjQUFjZixJQUFkLEVBQW9CbUIsR0FBcEIsQ0FBeUIsR0FBRUgsYUFBYyxJQUFHaEIsSUFBSyxJQUFHb0IsQ0FBRSxFQUF0RCxDQUFMLEVBQStEO0FBQzdERixzQkFBYSxHQUFFRixhQUFjLElBQUdoQixJQUFLLElBQUdvQixDQUFFLEVBQTFDO0FBQ0E7QUFDRDtBQUNGO0FBQ0Y7QUFDREgsZUFBV2pCLElBQVgsSUFBbUJrQixTQUFuQjtBQUNELEdBZkQ7QUFnQkEsU0FBT0QsVUFBUDtBQUNEIiwiZmlsZSI6Im5vLW5hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVvdmVydmlldyBSdWxlIHRvIGRpc2FsbG93IG5hbWVzcGFjZSBpbXBvcnRcbiAqIEBhdXRob3IgUmFkZWsgQmVua2VsXG4gKi9cblxuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBSdWxlIERlZmluaXRpb25cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICB0eXBlOiAnc3VnZ2VzdGlvbicsXG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCduby1uYW1lc3BhY2UnKSxcbiAgICB9LFxuICAgIGZpeGFibGU6ICdjb2RlJyxcbiAgICBzY2hlbWE6IFtdLFxuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgJ0ltcG9ydE5hbWVzcGFjZVNwZWNpZmllcic6IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIGNvbnN0IHNjb3BlVmFyaWFibGVzID0gY29udGV4dC5nZXRTY29wZSgpLnZhcmlhYmxlcztcbiAgICAgICAgY29uc3QgbmFtZXNwYWNlVmFyaWFibGUgPSBzY29wZVZhcmlhYmxlcy5maW5kKCh2YXJpYWJsZSkgPT5cbiAgICAgICAgICB2YXJpYWJsZS5kZWZzWzBdLm5vZGUgPT09IG5vZGVcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgbmFtZXNwYWNlUmVmZXJlbmNlcyA9IG5hbWVzcGFjZVZhcmlhYmxlLnJlZmVyZW5jZXM7XG4gICAgICAgIGNvbnN0IG5hbWVzcGFjZUlkZW50aWZpZXJzID0gbmFtZXNwYWNlUmVmZXJlbmNlcy5tYXAocmVmZXJlbmNlID0+IHJlZmVyZW5jZS5pZGVudGlmaWVyKTtcbiAgICAgICAgY29uc3QgY2FuRml4ID0gbmFtZXNwYWNlSWRlbnRpZmllcnMubGVuZ3RoID4gMCAmJiAhdXNlc05hbWVzcGFjZUFzT2JqZWN0KG5hbWVzcGFjZUlkZW50aWZpZXJzKTtcblxuICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICBtZXNzYWdlOiBgVW5leHBlY3RlZCBuYW1lc3BhY2UgaW1wb3J0LmAsXG4gICAgICAgICAgZml4OiBjYW5GaXggJiYgKGZpeGVyID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNjb3BlTWFuYWdlciA9IGNvbnRleHQuZ2V0U291cmNlQ29kZSgpLnNjb3BlTWFuYWdlcjtcbiAgICAgICAgICAgIGNvbnN0IGZpeGVzID0gW107XG5cbiAgICAgICAgICAgIC8vIFBhc3MgMTogQ29sbGVjdCB2YXJpYWJsZSBuYW1lcyB0aGF0IGFyZSBhbHJlYWR5IGluIHNjb3BlIGZvciBlYWNoIHJlZmVyZW5jZSB3ZSB3YW50XG4gICAgICAgICAgICAvLyB0byB0cmFuc2Zvcm0sIHNvIHRoYXQgd2UgY2FuIGJlIHN1cmUgdGhhdCB3ZSBjaG9vc2Ugbm9uLWNvbmZsaWN0aW5nIGltcG9ydCBuYW1lc1xuICAgICAgICAgICAgY29uc3QgaW1wb3J0TmFtZUNvbmZsaWN0cyA9IHt9O1xuICAgICAgICAgICAgbmFtZXNwYWNlSWRlbnRpZmllcnMuZm9yRWFjaCgoaWRlbnRpZmllcikgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBpZGVudGlmaWVyLnBhcmVudDtcbiAgICAgICAgICAgICAgaWYgKHBhcmVudCAmJiBwYXJlbnQudHlwZSA9PT0gJ01lbWJlckV4cHJlc3Npb24nKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW1wb3J0TmFtZSA9IGdldE1lbWJlclByb3BlcnR5TmFtZShwYXJlbnQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxvY2FsQ29uZmxpY3RzID0gZ2V0VmFyaWFibGVOYW1lc0luU2NvcGUoc2NvcGVNYW5hZ2VyLCBwYXJlbnQpO1xuICAgICAgICAgICAgICAgIGlmICghaW1wb3J0TmFtZUNvbmZsaWN0c1tpbXBvcnROYW1lXSkge1xuICAgICAgICAgICAgICAgICAgaW1wb3J0TmFtZUNvbmZsaWN0c1tpbXBvcnROYW1lXSA9IGxvY2FsQ29uZmxpY3RzO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBsb2NhbENvbmZsaWN0cy5mb3JFYWNoKChjKSA9PiBpbXBvcnROYW1lQ29uZmxpY3RzW2ltcG9ydE5hbWVdLmFkZChjKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gQ2hvb3NlIG5ldyBuYW1lcyBmb3IgZWFjaCBpbXBvcnRcbiAgICAgICAgICAgIGNvbnN0IGltcG9ydE5hbWVzID0gT2JqZWN0LmtleXMoaW1wb3J0TmFtZUNvbmZsaWN0cyk7XG4gICAgICAgICAgICBjb25zdCBpbXBvcnRMb2NhbE5hbWVzID0gZ2VuZXJhdGVMb2NhbE5hbWVzKFxuICAgICAgICAgICAgICBpbXBvcnROYW1lcyxcbiAgICAgICAgICAgICAgaW1wb3J0TmFtZUNvbmZsaWN0cyxcbiAgICAgICAgICAgICAgbmFtZXNwYWNlVmFyaWFibGUubmFtZVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgLy8gUmVwbGFjZSB0aGUgSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyIHdpdGggYSBsaXN0IG9mIEltcG9ydFNwZWNpZmllcnNcbiAgICAgICAgICAgIGNvbnN0IG5hbWVkSW1wb3J0U3BlY2lmaWVycyA9IGltcG9ydE5hbWVzLm1hcCgoaW1wb3J0TmFtZSkgPT5cbiAgICAgICAgICAgICAgaW1wb3J0TmFtZSA9PT0gaW1wb3J0TG9jYWxOYW1lc1tpbXBvcnROYW1lXVxuICAgICAgICAgICAgICAgID8gaW1wb3J0TmFtZVxuICAgICAgICAgICAgICAgIDogYCR7aW1wb3J0TmFtZX0gYXMgJHtpbXBvcnRMb2NhbE5hbWVzW2ltcG9ydE5hbWVdfWBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBmaXhlcy5wdXNoKGZpeGVyLnJlcGxhY2VUZXh0KG5vZGUsIGB7ICR7bmFtZWRJbXBvcnRTcGVjaWZpZXJzLmpvaW4oJywgJyl9IH1gKSk7XG5cbiAgICAgICAgICAgIC8vIFBhc3MgMjogUmVwbGFjZSByZWZlcmVuY2VzIHRvIHRoZSBuYW1lc3BhY2Ugd2l0aCByZWZlcmVuY2VzIHRvIHRoZSBuYW1lZCBpbXBvcnRzXG4gICAgICAgICAgICBuYW1lc3BhY2VJZGVudGlmaWVycy5mb3JFYWNoKChpZGVudGlmaWVyKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IGlkZW50aWZpZXIucGFyZW50O1xuICAgICAgICAgICAgICBpZiAocGFyZW50ICYmIHBhcmVudC50eXBlID09PSAnTWVtYmVyRXhwcmVzc2lvbicpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbXBvcnROYW1lID0gZ2V0TWVtYmVyUHJvcGVydHlOYW1lKHBhcmVudCk7XG4gICAgICAgICAgICAgICAgZml4ZXMucHVzaChmaXhlci5yZXBsYWNlVGV4dChwYXJlbnQsIGltcG9ydExvY2FsTmFtZXNbaW1wb3J0TmFtZV0pKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBmaXhlcztcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG59O1xuXG4vKipcbiAqIEBwYXJhbSB7SWRlbnRpZmllcltdfSBuYW1lc3BhY2VJZGVudGlmaWVyc1xuICogQHJldHVybnMge2Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgbmFtZXNwYWNlIHZhcmlhYmxlIGlzIG1vcmUgdGhhbiBqdXN0IGEgZ2xvcmlmaWVkIGNvbnN0YW50XG4gKi9cbmZ1bmN0aW9uIHVzZXNOYW1lc3BhY2VBc09iamVjdChuYW1lc3BhY2VJZGVudGlmaWVycykge1xuICByZXR1cm4gIW5hbWVzcGFjZUlkZW50aWZpZXJzLmV2ZXJ5KChpZGVudGlmaWVyKSA9PiB7XG4gICAgY29uc3QgcGFyZW50ID0gaWRlbnRpZmllci5wYXJlbnQ7XG5cbiAgICAvLyBgbmFtZXNwYWNlLnhgIG9yIGBuYW1lc3BhY2VbJ3gnXWBcbiAgICByZXR1cm4gKFxuICAgICAgcGFyZW50ICYmIHBhcmVudC50eXBlID09PSAnTWVtYmVyRXhwcmVzc2lvbicgJiZcbiAgICAgIChwYXJlbnQucHJvcGVydHkudHlwZSA9PT0gJ0lkZW50aWZpZXInIHx8IHBhcmVudC5wcm9wZXJ0eS50eXBlID09PSAnTGl0ZXJhbCcpXG4gICAgKTtcbiAgfSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtNZW1iZXJFeHByZXNzaW9ufSBtZW1iZXJFeHByZXNzaW9uXG4gKiBAcmV0dXJucyB7c3RyaW5nfSB0aGUgbmFtZSBvZiB0aGUgbWVtYmVyIGluIHRoZSBvYmplY3QgZXhwcmVzc2lvbiwgZS5nLiB0aGUgYHhgIGluIGBuYW1lc3BhY2UueGBcbiAqL1xuZnVuY3Rpb24gZ2V0TWVtYmVyUHJvcGVydHlOYW1lKG1lbWJlckV4cHJlc3Npb24pIHtcbiAgcmV0dXJuIG1lbWJlckV4cHJlc3Npb24ucHJvcGVydHkudHlwZSA9PT0gJ0lkZW50aWZpZXInXG4gICAgPyBtZW1iZXJFeHByZXNzaW9uLnByb3BlcnR5Lm5hbWVcbiAgICA6IG1lbWJlckV4cHJlc3Npb24ucHJvcGVydHkudmFsdWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtTY29wZU1hbmFnZXJ9IHNjb3BlTWFuYWdlclxuICogQHBhcmFtIHtBU1ROb2RlfSBub2RlXG4gKiBAcmV0dXJuIHtTZXQ8c3RyaW5nPn1cbiAqL1xuZnVuY3Rpb24gZ2V0VmFyaWFibGVOYW1lc0luU2NvcGUoc2NvcGVNYW5hZ2VyLCBub2RlKSB7XG4gIGxldCBjdXJyZW50Tm9kZSA9IG5vZGU7XG4gIGxldCBzY29wZSA9IHNjb3BlTWFuYWdlci5hY3F1aXJlKGN1cnJlbnROb2RlKTtcbiAgd2hpbGUgKHNjb3BlID09IG51bGwpIHtcbiAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLnBhcmVudDtcbiAgICBzY29wZSA9IHNjb3BlTWFuYWdlci5hY3F1aXJlKGN1cnJlbnROb2RlLCB0cnVlKTtcbiAgfVxuICByZXR1cm4gbmV3IFNldChbXG4gICAgLi4uc2NvcGUudmFyaWFibGVzLm1hcCh2YXJpYWJsZSA9PiB2YXJpYWJsZS5uYW1lKSxcbiAgICAuLi5zY29wZS51cHBlci52YXJpYWJsZXMubWFwKHZhcmlhYmxlID0+IHZhcmlhYmxlLm5hbWUpLFxuICBdKTtcbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIHsqfSBuYW1lc1xuICogQHBhcmFtIHsqfSBuYW1lQ29uZmxpY3RzXG4gKiBAcGFyYW0geyp9IG5hbWVzcGFjZU5hbWVcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVMb2NhbE5hbWVzKG5hbWVzLCBuYW1lQ29uZmxpY3RzLCBuYW1lc3BhY2VOYW1lKSB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB7fTtcbiAgbmFtZXMuZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgIGxldCBsb2NhbE5hbWU7XG4gICAgaWYgKCFuYW1lQ29uZmxpY3RzW25hbWVdLmhhcyhuYW1lKSkge1xuICAgICAgbG9jYWxOYW1lID0gbmFtZTtcbiAgICB9IGVsc2UgaWYgKCFuYW1lQ29uZmxpY3RzW25hbWVdLmhhcyhgJHtuYW1lc3BhY2VOYW1lfV8ke25hbWV9YCkpIHtcbiAgICAgIGxvY2FsTmFtZSA9IGAke25hbWVzcGFjZU5hbWV9XyR7bmFtZX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8IEluZmluaXR5OyBpKyspIHtcbiAgICAgICAgaWYgKCFuYW1lQ29uZmxpY3RzW25hbWVdLmhhcyhgJHtuYW1lc3BhY2VOYW1lfV8ke25hbWV9XyR7aX1gKSkge1xuICAgICAgICAgIGxvY2FsTmFtZSA9IGAke25hbWVzcGFjZU5hbWV9XyR7bmFtZX1fJHtpfWA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgbG9jYWxOYW1lc1tuYW1lXSA9IGxvY2FsTmFtZTtcbiAgfSk7XG4gIHJldHVybiBsb2NhbE5hbWVzO1xufVxuIl19