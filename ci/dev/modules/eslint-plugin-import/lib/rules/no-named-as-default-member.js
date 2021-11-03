'use strict';





var _ExportMap = require('../ExportMap');var _ExportMap2 = _interopRequireDefault(_ExportMap);
var _importDeclaration = require('../importDeclaration');var _importDeclaration2 = _interopRequireDefault(_importDeclaration);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-named-as-default-member') },

    schema: [] },


  create: function (context) {

    const fileImports = new Map();
    const allPropertyLookups = new Map();

    function handleImportDefault(node) {
      const declaration = (0, _importDeclaration2.default)(context);
      const exportMap = _ExportMap2.default.get(declaration.source.value, context);
      if (exportMap == null) return;

      if (exportMap.errors.length) {
        exportMap.reportErrors(context, declaration);
        return;
      }

      fileImports.set(node.local.name, {
        exportMap,
        sourcePath: declaration.source.value });

    }

    function storePropertyLookup(objectName, propName, node) {
      const lookups = allPropertyLookups.get(objectName) || [];
      lookups.push({ node, propName });
      allPropertyLookups.set(objectName, lookups);
    }

    function handlePropLookup(node) {
      const objectName = node.object.name;
      const propName = node.property.name;
      storePropertyLookup(objectName, propName, node);
    }

    function handleDestructuringAssignment(node) {
      const isDestructure =
      node.id.type === 'ObjectPattern' &&
      node.init != null &&
      node.init.type === 'Identifier';

      if (!isDestructure) return;

      const objectName = node.init.name;
      for (const _ref of node.id.properties) {const key = _ref.key;
        if (key == null) continue; // true for rest properties
        storePropertyLookup(objectName, key.name, key);
      }
    }

    function handleProgramExit() {
      allPropertyLookups.forEach((lookups, objectName) => {
        const fileImport = fileImports.get(objectName);
        if (fileImport == null) return;

        for (const _ref2 of lookups) {const propName = _ref2.propName;const node = _ref2.node;
          // the default import can have a "default" property
          if (propName === 'default') continue;
          if (!fileImport.exportMap.namespace.has(propName)) continue;

          context.report({
            node,
            message:
            `Caution: \`${objectName}\` also has a named export ` +
            `\`${propName}\`. Check if you meant to write ` +
            `\`import {${propName}} from '${fileImport.sourcePath}'\` ` +
            'instead.' });


        }
      });
    }

    return {
      'ImportDefaultSpecifier': handleImportDefault,
      'MemberExpression': handlePropLookup,
      'VariableDeclarator': handleDestructuringAssignment,
      'Program:exit': handleProgramExit };

  } }; /**
        * @fileoverview Rule to warn about potentially confused use of name exports
        * @author Desmond Brand
        * @copyright 2016 Desmond Brand. All rights reserved.
        * See LICENSE in root directory for full license.
        */
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1uYW1lZC1hcy1kZWZhdWx0LW1lbWJlci5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsInR5cGUiLCJkb2NzIiwidXJsIiwic2NoZW1hIiwiY3JlYXRlIiwiY29udGV4dCIsImZpbGVJbXBvcnRzIiwiTWFwIiwiYWxsUHJvcGVydHlMb29rdXBzIiwiaGFuZGxlSW1wb3J0RGVmYXVsdCIsIm5vZGUiLCJkZWNsYXJhdGlvbiIsImV4cG9ydE1hcCIsIkV4cG9ydHMiLCJnZXQiLCJzb3VyY2UiLCJ2YWx1ZSIsImVycm9ycyIsImxlbmd0aCIsInJlcG9ydEVycm9ycyIsInNldCIsImxvY2FsIiwibmFtZSIsInNvdXJjZVBhdGgiLCJzdG9yZVByb3BlcnR5TG9va3VwIiwib2JqZWN0TmFtZSIsInByb3BOYW1lIiwibG9va3VwcyIsInB1c2giLCJoYW5kbGVQcm9wTG9va3VwIiwib2JqZWN0IiwicHJvcGVydHkiLCJoYW5kbGVEZXN0cnVjdHVyaW5nQXNzaWdubWVudCIsImlzRGVzdHJ1Y3R1cmUiLCJpZCIsImluaXQiLCJwcm9wZXJ0aWVzIiwia2V5IiwiaGFuZGxlUHJvZ3JhbUV4aXQiLCJmb3JFYWNoIiwiZmlsZUltcG9ydCIsIm5hbWVzcGFjZSIsImhhcyIsInJlcG9ydCIsIm1lc3NhZ2UiXSwibWFwcGluZ3MiOiI7Ozs7OztBQU1BLHlDO0FBQ0EseUQ7QUFDQSxxQzs7QUFFQTtBQUNBO0FBQ0E7O0FBRUFBLE9BQU9DLE9BQVAsR0FBaUI7QUFDZkMsUUFBTTtBQUNKQyxVQUFNLFlBREY7QUFFSkMsVUFBTTtBQUNKQyxXQUFLLHVCQUFRLDRCQUFSLENBREQsRUFGRjs7QUFLSkMsWUFBUSxFQUxKLEVBRFM7OztBQVNmQyxVQUFRLFVBQVNDLE9BQVQsRUFBa0I7O0FBRXhCLFVBQU1DLGNBQWMsSUFBSUMsR0FBSixFQUFwQjtBQUNBLFVBQU1DLHFCQUFxQixJQUFJRCxHQUFKLEVBQTNCOztBQUVBLGFBQVNF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c0JBQWdCTSxpQkFKWCxFQUFQOztBQU1ELEdBdEZjLEVBQWpCLEMsQ0FkQSIsImZpbGUiOiJuby1uYW1lZC1hcy1kZWZhdWx0LW1lbWJlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVvdmVydmlldyBSdWxlIHRvIHdhcm4gYWJvdXQgcG90ZW50aWFsbHkgY29uZnVzZWQgdXNlIG9mIG5hbWUgZXhwb3J0c1xuICogQGF1dGhvciBEZXNtb25kIEJyYW5kXG4gKiBAY29weXJpZ2h0IDIwMTYgRGVzbW9uZCBCcmFuZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFNlZSBMSUNFTlNFIGluIHJvb3QgZGlyZWN0b3J5IGZvciBmdWxsIGxpY2Vuc2UuXG4gKi9cbmltcG9ydCBFeHBvcnRzIGZyb20gJy4uL0V4cG9ydE1hcCc7XG5pbXBvcnQgaW1wb3J0RGVjbGFyYXRpb24gZnJvbSAnLi4vaW1wb3J0RGVjbGFyYXRpb24nO1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBSdWxlIERlZmluaXRpb25cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3N1Z2dlc3Rpb24nLFxuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgnbm8tbmFtZWQtYXMtZGVmYXVsdC1tZW1iZXInKSxcbiAgICB9LFxuICAgIHNjaGVtYTogW10sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbihjb250ZXh0KSB7XG5cbiAgICBjb25zdCBmaWxlSW1wb3J0cyA9IG5ldyBNYXAoKTtcbiAgICBjb25zdCBhbGxQcm9wZXJ0eUxvb2t1cHMgPSBuZXcgTWFwKCk7XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVJbXBvcnREZWZhdWx0KG5vZGUpIHtcbiAgICAgIGNvbnN0IGRlY2xhcmF0aW9uID0gaW1wb3J0RGVjbGFyYXRpb24oY29udGV4dCk7XG4gICAgICBjb25zdCBleHBvcnRNYXAgPSBFeHBvcnRzLmdldChkZWNsYXJhdGlvbi5zb3VyY2UudmFsdWUsIGNvbnRleHQpO1xuICAgICAgaWYgKGV4cG9ydE1hcCA9PSBudWxsKSByZXR1cm47XG5cbiAgICAgIGlmIChleHBvcnRNYXAuZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICBleHBvcnRNYXAucmVwb3J0RXJyb3JzKGNvbnRleHQsIGRlY2xhcmF0aW9uKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBmaWxlSW1wb3J0cy5zZXQobm9kZS5sb2NhbC5uYW1lLCB7XG4gICAgICAgIGV4cG9ydE1hcCxcbiAgICAgICAgc291cmNlUGF0aDogZGVjbGFyYXRpb24uc291cmNlLnZhbHVlLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RvcmVQcm9wZXJ0eUxvb2t1cChvYmplY3ROYW1lLCBwcm9wTmFtZSwgbm9kZSkge1xuICAgICAgY29uc3QgbG9va3VwcyA9IGFsbFByb3BlcnR5TG9va3Vwcy5nZXQob2JqZWN0TmFtZSkgfHwgW107XG4gICAgICBsb29rdXBzLnB1c2goeyBub2RlLCBwcm9wTmFtZSB9KTtcbiAgICAgIGFsbFByb3BlcnR5TG9va3Vwcy5zZXQob2JqZWN0TmFtZSwgbG9va3Vwcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlUHJvcExvb2t1cChub2RlKSB7XG4gICAgICBjb25zdCBvYmplY3ROYW1lID0gbm9kZS5vYmplY3QubmFtZTtcbiAgICAgIGNvbnN0IHByb3BOYW1lID0gbm9kZS5wcm9wZXJ0eS5uYW1lO1xuICAgICAgc3RvcmVQcm9wZXJ0eUxvb2t1cChvYmplY3ROYW1lLCBwcm9wTmFtZSwgbm9kZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQobm9kZSkge1xuICAgICAgY29uc3QgaXNEZXN0cnVjdHVyZSA9IChcbiAgICAgICAgbm9kZS5pZC50eXBlID09PSAnT2JqZWN0UGF0dGVybicgJiZcbiAgICAgICAgbm9kZS5pbml0ICE9IG51bGwgJiZcbiAgICAgICAgbm9kZS5pbml0LnR5cGUgPT09ICdJZGVudGlmaWVyJ1xuICAgICAgKTtcbiAgICAgIGlmICghaXNEZXN0cnVjdHVyZSkgcmV0dXJuO1xuXG4gICAgICBjb25zdCBvYmplY3ROYW1lID0gbm9kZS5pbml0Lm5hbWU7XG4gICAgICBmb3IgKGNvbnN0IHsga2V5IH0gb2Ygbm9kZS5pZC5wcm9wZXJ0aWVzKSB7XG4gICAgICAgIGlmIChrZXkgPT0gbnVsbCkgY29udGludWU7ICAvLyB0cnVlIGZvciByZXN0IHByb3BlcnRpZXNcbiAgICAgICAgc3RvcmVQcm9wZXJ0eUxvb2t1cChvYmplY3ROYW1lLCBrZXkubmFtZSwga2V5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVQcm9ncmFtRXhpdCgpIHtcbiAgICAgIGFsbFByb3BlcnR5TG9va3Vwcy5mb3JFYWNoKChsb29rdXBzLCBvYmplY3ROYW1lKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGVJbXBvcnQgPSBmaWxlSW1wb3J0cy5nZXQob2JqZWN0TmFtZSk7XG4gICAgICAgIGlmIChmaWxlSW1wb3J0ID09IG51bGwpIHJldHVybjtcblxuICAgICAgICBmb3IgKGNvbnN0IHsgcHJvcE5hbWUsIG5vZGUgfSBvZiBsb29rdXBzKSB7XG4gICAgICAgICAgLy8gdGhlIGRlZmF1bHQgaW1wb3J0IGNhbiBoYXZlIGEgXCJkZWZhdWx0XCIgcHJvcGVydHlcbiAgICAgICAgICBpZiAocHJvcE5hbWUgPT09ICdkZWZhdWx0JykgY29udGludWU7XG4gICAgICAgICAgaWYgKCFmaWxlSW1wb3J0LmV4cG9ydE1hcC5uYW1lc3BhY2UuaGFzKHByb3BOYW1lKSkgY29udGludWU7XG5cbiAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgbWVzc2FnZTogKFxuICAgICAgICAgICAgICBgQ2F1dGlvbjogXFxgJHtvYmplY3ROYW1lfVxcYCBhbHNvIGhhcyBhIG5hbWVkIGV4cG9ydCBgICtcbiAgICAgICAgICAgICAgYFxcYCR7cHJvcE5hbWV9XFxgLiBDaGVjayBpZiB5b3UgbWVhbnQgdG8gd3JpdGUgYCArXG4gICAgICAgICAgICAgIGBcXGBpbXBvcnQgeyR7cHJvcE5hbWV9fSBmcm9tICcke2ZpbGVJbXBvcnQuc291cmNlUGF0aH0nXFxgIGAgK1xuICAgICAgICAgICAgICAnaW5zdGVhZC4nXG4gICAgICAgICAgICApLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgJ0ltcG9ydERlZmF1bHRTcGVjaWZpZXInOiBoYW5kbGVJbXBvcnREZWZhdWx0LFxuICAgICAgJ01lbWJlckV4cHJlc3Npb24nOiBoYW5kbGVQcm9wTG9va3VwLFxuICAgICAgJ1ZhcmlhYmxlRGVjbGFyYXRvcic6IGhhbmRsZURlc3RydWN0dXJpbmdBc3NpZ25tZW50LFxuICAgICAgJ1Byb2dyYW06ZXhpdCc6IGhhbmRsZVByb2dyYW1FeGl0LFxuICAgIH07XG4gIH0sXG59O1xuIl19