'use strict';var _declaredScope = require('eslint-module-utils/declaredScope');var _declaredScope2 = _interopRequireDefault(_declaredScope);
var _ExportMap = require('../ExportMap');var _ExportMap2 = _interopRequireDefault(_ExportMap);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function message(deprecation) {
  return 'Deprecated' + (deprecation.description ? ': ' + deprecation.description : '.');
}

function getDeprecation(metadata) {
  if (!metadata || !metadata.doc) return;

  return metadata.doc.tags.find(t => t.title === 'deprecated');
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-deprecated') },

    schema: [] },


  create: function (context) {
    const deprecated = new Map();
    const namespaces = new Map();

    function checkSpecifiers(node) {
      if (node.type !== 'ImportDeclaration') return;
      if (node.source == null) return; // local export, ignore

      const imports = _ExportMap2.default.get(node.source.value, context);
      if (imports == null) return;

      const moduleDeprecation = imports.doc && imports.doc.tags.find(t => t.title === 'deprecated');
      if (moduleDeprecation) {
        context.report({ node, message: message(moduleDeprecation) });
      }

      if (imports.errors.length) {
        imports.reportErrors(context, node);
        return;
      }

      node.specifiers.forEach(function (im) {
        let imported;let local;
        switch (im.type) {


          case 'ImportNamespaceSpecifier':{
              if (!imports.size) return;
              namespaces.set(im.local.name, imports);
              return;
            }

          case 'ImportDefaultSpecifier':
            imported = 'default';
            local = im.local.name;
            break;

          case 'ImportSpecifier':
            imported = im.imported.name;
            local = im.local.name;
            break;

          default:return; // can't handle this one
        }

        // unknown thing can't be deprecated
        const exported = imports.get(imported);
        if (exported == null) return;

        // capture import of deep namespace
        if (exported.namespace) namespaces.set(local, exported.namespace);

        const deprecation = getDeprecation(imports.get(imported));
        if (!deprecation) return;

        context.report({ node: im, message: message(deprecation) });

        deprecated.set(local, deprecation);

      });
    }

    return {
      'Program': (_ref) => {let body = _ref.body;return body.forEach(checkSpecifiers);},

      'Identifier': function (node) {
        if (node.parent.type === 'MemberExpression' && node.parent.property === node) {
          return; // handled by MemberExpression
        }

        // ignore specifier identifiers
        if (node.parent.type.slice(0, 6) === 'Import') return;

        if (!deprecated.has(node.name)) return;

        if ((0, _declaredScope2.default)(context, node.name) !== 'module') return;
        context.report({
          node,
          message: message(deprecated.get(node.name)) });

      },

      'MemberExpression': function (dereference) {
        if (dereference.object.type !== 'Identifier') return;
        if (!namespaces.has(dereference.object.name)) return;

        if ((0, _declaredScope2.default)(context, dereference.object.name) !== 'module') return;

        // go deep
        let namespace = namespaces.get(dereference.object.name);
        const namepath = [dereference.object.name];
        // while property is namespace and parent is member expression, keep validating
        while (namespace instanceof _ExportMap2.default &&
        dereference.type === 'MemberExpression') {

          // ignore computed parts for now
          if (dereference.computed) return;

          const metadata = namespace.get(dereference.property.name);

          if (!metadata) break;
          const deprecation = getDeprecation(metadata);

          if (deprecation) {
            context.report({ node: dereference.property, message: message(deprecation) });
          }

          // stash and pop
          namepath.push(dereference.property.name);
          namespace = metadata.namespace;
          dereference = dereference.parent;
        }
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1kZXByZWNhdGVkLmpzIl0sIm5hbWVzIjpbIm1lc3NhZ2UiLCJkZXByZWNhdGlvbiIsImRlc2NyaXB0aW9uIiwiZ2V0RGVwcmVjYXRpb24iLCJtZXRhZGF0YSIsImRvYyIsInRhZ3MiLCJmaW5kIiwidCIsInRpdGxlIiwibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJ0eXBlIiwiZG9jcyIsInVybCIsInNjaGVtYSIsImNyZWF0ZSIsImNvbnRleHQiLCJkZXByZWNhdGVkIiwiTWFwIiwibmFtZXNwYWNlcyIsImNoZWNrU3BlY2lmaWVycyIsIm5vZGUiLCJzb3VyY2UiLCJpbXBvcnRzIiwiRXhwb3J0cyIsImdldCIsInZhbHVlIiwibW9kdWxlRGVwcmVjYXRpb24iLCJyZXBvcnQiLCJlcnJvcnMiLCJsZW5ndGgiLCJyZXBvcnRFcnJvcnMiLCJzcGVjaWZpZXJzIiwiZm9yRWFjaCIsImltIiwiaW1wb3J0ZWQiLCJsb2NhbCIsInNpemUiLCJzZXQiLCJuYW1lIiwiZXhwb3J0ZWQiLCJuYW1lc3BhY2UiLCJib2R5IiwicGFyZW50IiwicHJvcGVydHkiLCJzbGljZSIsImhhcyIsImRlcmVmZXJlbmNlIiwib2JqZWN0IiwibmFtZXBhdGgiLCJjb21wdXRlZCIsInB1c2giXSwibWFwcGluZ3MiOiJhQUFBLGtFO0FBQ0EseUM7QUFDQSxxQzs7QUFFQSxTQUFTQSxPQUFULENBQWlCQyxXQUFqQixFQUE4QjtBQUM1QixTQUFPLGdCQUFnQkEsWUFBWUMsV0FBWixHQUEwQixPQUFPRCxZQUFZQyxXQUE3QyxHQUEyRCxHQUEzRSxDQUFQO0FBQ0Q7O0FBRUQsU0FBU0MsY0FBVCxDQUF3QkMsUUFBeEIsRUFBa0M7QUFDaEMsTUFBSSxDQUFDQSxRQUFELElBQWEsQ0FBQ0EsU0FBU0MsR0FBM0IsRUFBZ0M7O0FBRWhDLFNBQU9ELFNBQVNDLEdBQVQsQ0FBYUMsSUFBYixDQUFrQkMsSUFBbEIsQ0FBdUJDLEtBQUtBLEVBQUVDLEtBQUYsS0FBWSxZ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QkwsSUFBbkMsQ0FBakI7O0FBRUEsY0FBSSxDQUFDckMsUUFBTCxFQUFlO0FBQ2YsZ0JBQU1ILGNBQWNFLGVBQWVDLFFBQWYsQ0FBcEI7O0FBRUEsY0FBSUgsV0FBSixFQUFpQjtBQUNmaUIsb0JBQVFZLE1BQVIsQ0FBZSxFQUFFUCxNQUFNMEIsWUFBWUgsUUFBcEIsRUFBOEI5QyxTQUFTQSxRQUFRQyxXQUFSLENBQXZDLEVBQWY7QUFDRDs7QUFFRDtBQUNBa0QsbUJBQVNFLElBQVQsQ0FBY0osWUFBWUgsUUFBWixDQUFxQkwsSUFBbkM7QUFDQUUsc0JBQVl2QyxTQUFTdUMsU0FBckI7QUFDQU0sd0JBQWNBLFlBQVlKLE1BQTFCO0FBQ0Q7QUFDRixPQWxESSxFQUFQOztBQW9ERCxHQTNIYyxFQUFqQiIsImZpbGUiOiJuby1kZXByZWNhdGVkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGRlY2xhcmVkU2NvcGUgZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9kZWNsYXJlZFNjb3BlJztcbmltcG9ydCBFeHBvcnRzIGZyb20gJy4uL0V4cG9ydE1hcCc7XG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJztcblxuZnVuY3Rpb24gbWVzc2FnZShkZXByZWNhdGlvbikge1xuICByZXR1cm4gJ0RlcHJlY2F0ZWQnICsgKGRlcHJlY2F0aW9uLmRlc2NyaXB0aW9uID8gJzogJyArIGRlcHJlY2F0aW9uLmRlc2NyaXB0aW9uIDogJy4nKTtcbn1cblxuZnVuY3Rpb24gZ2V0RGVwcmVjYXRpb24obWV0YWRhdGEpIHtcbiAgaWYgKCFtZXRhZGF0YSB8fCAhbWV0YWRhdGEuZG9jKSByZXR1cm47XG5cbiAgcmV0dXJuIG1ldGFkYXRhLmRvYy50YWdzLmZpbmQodCA9PiB0LnRpdGxlID09PSAnZGVwcmVjYXRlZCcpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ25vLWRlcHJlY2F0ZWQnKSxcbiAgICB9LFxuICAgIHNjaGVtYTogW10sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiAoY29udGV4dCkge1xuICAgIGNvbnN0IGRlcHJlY2F0ZWQgPSBuZXcgTWFwKCk7XG4gICAgY29uc3QgbmFtZXNwYWNlcyA9IG5ldyBNYXAoKTtcblxuICAgIGZ1bmN0aW9uIGNoZWNrU3BlY2lmaWVycyhub2RlKSB7XG4gICAgICBpZiAobm9kZS50eXBlICE9PSAnSW1wb3J0RGVjbGFyYXRpb24nKSByZXR1cm47XG4gICAgICBpZiAobm9kZS5zb3VyY2UgPT0gbnVsbCkgcmV0dXJuOyAvLyBsb2NhbCBleHBvcnQsIGlnbm9yZVxuXG4gICAgICBjb25zdCBpbXBvcnRzID0gRXhwb3J0cy5nZXQobm9kZS5zb3VyY2UudmFsdWUsIGNvbnRleHQpO1xuICAgICAgaWYgKGltcG9ydHMgPT0gbnVsbCkgcmV0dXJuO1xuXG4gICAgICBjb25zdCBtb2R1bGVEZXByZWNhdGlvbiA9IGltcG9ydHMuZG9jICYmIGltcG9ydHMuZG9jLnRhZ3MuZmluZCh0ID0+IHQudGl0bGUgPT09ICdkZXByZWNhdGVkJyk7XG4gICAgICBpZiAobW9kdWxlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29udGV4dC5yZXBvcnQoeyBub2RlLCBtZXNzYWdlOiBtZXNzYWdlKG1vZHVsZURlcHJlY2F0aW9uKSB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGltcG9ydHMuZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICBpbXBvcnRzLnJlcG9ydEVycm9ycyhjb250ZXh0LCBub2RlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBub2RlLnNwZWNpZmllcnMuZm9yRWFjaChmdW5jdGlvbiAoaW0pIHtcbiAgICAgICAgbGV0IGltcG9ydGVkOyBsZXQgbG9jYWw7XG4gICAgICAgIHN3aXRjaCAoaW0udHlwZSkge1xuXG5cbiAgICAgICAgY2FzZSAnSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyJzp7XG4gICAgICAgICAgaWYgKCFpbXBvcnRzLnNpemUpIHJldHVybjtcbiAgICAgICAgICBuYW1lc3BhY2VzLnNldChpbS5sb2NhbC5uYW1lLCBpbXBvcnRzKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjYXNlICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJzpcbiAgICAgICAgICBpbXBvcnRlZCA9ICdkZWZhdWx0JztcbiAgICAgICAgICBsb2NhbCA9IGltLmxvY2FsLm5hbWU7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnSW1wb3J0U3BlY2lmaWVyJzpcbiAgICAgICAgICBpbXBvcnRlZCA9IGltLmltcG9ydGVkLm5hbWU7XG4gICAgICAgICAgbG9jYWwgPSBpbS5sb2NhbC5uYW1lO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGRlZmF1bHQ6IHJldHVybjsgLy8gY2FuJ3QgaGFuZGxlIHRoaXMgb25lXG4gICAgICAgIH1cblxuICAgICAgICAvLyB1bmtub3duIHRoaW5nIGNhbid0IGJlIGRlcHJlY2F0ZWRcbiAgICAgICAgY29uc3QgZXhwb3J0ZWQgPSBpbXBvcnRzLmdldChpbXBvcnRlZCk7XG4gICAgICAgIGlmIChleHBvcnRlZCA9PSBudWxsKSByZXR1cm47XG5cbiAgICAgICAgLy8gY2FwdHVyZSBpbXBvcnQgb2YgZGVlcCBuYW1lc3BhY2VcbiAgICAgICAgaWYgKGV4cG9ydGVkLm5hbWVzcGFjZSkgbmFtZXNwYWNlcy5zZXQobG9jYWwsIGV4cG9ydGVkLm5hbWVzcGFjZSk7XG5cbiAgICAgICAgY29uc3QgZGVwcmVjYXRpb24gPSBnZXREZXByZWNhdGlvbihpbXBvcnRzLmdldChpbXBvcnRlZCkpO1xuICAgICAgICBpZiAoIWRlcHJlY2F0aW9uKSByZXR1cm47XG5cbiAgICAgICAgY29udGV4dC5yZXBvcnQoeyBub2RlOiBpbSwgbWVzc2FnZTogbWVzc2FnZShkZXByZWNhdGlvbikgfSk7XG5cbiAgICAgICAgZGVwcmVjYXRlZC5zZXQobG9jYWwsIGRlcHJlY2F0aW9uKTtcblxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICdQcm9ncmFtJzogKHsgYm9keSB9KSA9PiBib2R5LmZvckVhY2goY2hlY2tTcGVjaWZpZXJzKSxcblxuICAgICAgJ0lkZW50aWZpZXInOiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICBpZiAobm9kZS5wYXJlbnQudHlwZSA9PT0gJ01lbWJlckV4cHJlc3Npb24nICYmIG5vZGUucGFyZW50LnByb3BlcnR5ID09PSBub2RlKSB7XG4gICAgICAgICAgcmV0dXJuOyAvLyBoYW5kbGVkIGJ5IE1lbWJlckV4cHJlc3Npb25cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlnbm9yZSBzcGVjaWZpZXIgaWRlbnRpZmllcnNcbiAgICAgICAgaWYgKG5vZGUucGFyZW50LnR5cGUuc2xpY2UoMCwgNikgPT09ICdJbXBvcnQnKSByZXR1cm47XG5cbiAgICAgICAgaWYgKCFkZXByZWNhdGVkLmhhcyhub2RlLm5hbWUpKSByZXR1cm47XG5cbiAgICAgICAgaWYgKGRlY2xhcmVkU2NvcGUoY29udGV4dCwgbm9kZS5uYW1lKSAhPT0gJ21vZHVsZScpIHJldHVybjtcbiAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgbWVzc2FnZTogbWVzc2FnZShkZXByZWNhdGVkLmdldChub2RlLm5hbWUpKSxcbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICAnTWVtYmVyRXhwcmVzc2lvbic6IGZ1bmN0aW9uIChkZXJlZmVyZW5jZSkge1xuICAgICAgICBpZiAoZGVyZWZlcmVuY2Uub2JqZWN0LnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuO1xuICAgICAgICBpZiAoIW5hbWVzcGFjZXMuaGFzKGRlcmVmZXJlbmNlLm9iamVjdC5uYW1lKSkgcmV0dXJuO1xuXG4gICAgICAgIGlmIChkZWNsYXJlZFNjb3BlKGNvbnRleHQsIGRlcmVmZXJlbmNlLm9iamVjdC5uYW1lKSAhPT0gJ21vZHVsZScpIHJldHVybjtcblxuICAgICAgICAvLyBnbyBkZWVwXG4gICAgICAgIGxldCBuYW1lc3BhY2UgPSBuYW1lc3BhY2VzLmdldChkZXJlZmVyZW5jZS5vYmplY3QubmFtZSk7XG4gICAgICAgIGNvbnN0IG5hbWVwYXRoID0gW2RlcmVmZXJlbmNlLm9iamVjdC5uYW1lXTtcbiAgICAgICAgLy8gd2hpbGUgcHJvcGVydHkgaXMgbmFtZXNwYWNlIGFuZCBwYXJlbnQgaXMgbWVtYmVyIGV4cHJlc3Npb24sIGtlZXAgdmFsaWRhdGluZ1xuICAgICAgICB3aGlsZSAobmFtZXNwYWNlIGluc3RhbmNlb2YgRXhwb3J0cyAmJlxuICAgICAgICAgICAgICAgZGVyZWZlcmVuY2UudHlwZSA9PT0gJ01lbWJlckV4cHJlc3Npb24nKSB7XG5cbiAgICAgICAgICAvLyBpZ25vcmUgY29tcHV0ZWQgcGFydHMgZm9yIG5vd1xuICAgICAgICAgIGlmIChkZXJlZmVyZW5jZS5jb21wdXRlZCkgcmV0dXJuO1xuXG4gICAgICAgICAgY29uc3QgbWV0YWRhdGEgPSBuYW1lc3BhY2UuZ2V0KGRlcmVmZXJlbmNlLnByb3BlcnR5Lm5hbWUpO1xuXG4gICAgICAgICAgaWYgKCFtZXRhZGF0YSkgYnJlYWs7XG4gICAgICAgICAgY29uc3QgZGVwcmVjYXRpb24gPSBnZXREZXByZWNhdGlvbihtZXRhZGF0YSk7XG5cbiAgICAgICAgICBpZiAoZGVwcmVjYXRpb24pIHtcbiAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KHsgbm9kZTogZGVyZWZlcmVuY2UucHJvcGVydHksIG1lc3NhZ2U6IG1lc3NhZ2UoZGVwcmVjYXRpb24pIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIHN0YXNoIGFuZCBwb3BcbiAgICAgICAgICBuYW1lcGF0aC5wdXNoKGRlcmVmZXJlbmNlLnByb3BlcnR5Lm5hbWUpO1xuICAgICAgICAgIG5hbWVzcGFjZSA9IG1ldGFkYXRhLm5hbWVzcGFjZTtcbiAgICAgICAgICBkZXJlZmVyZW5jZSA9IGRlcmVmZXJlbmNlLnBhcmVudDtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9O1xuICB9LFxufTtcbiJdfQ==