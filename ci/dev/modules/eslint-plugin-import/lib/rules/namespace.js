'use strict';var _declaredScope = require('eslint-module-utils/declaredScope');var _declaredScope2 = _interopRequireDefault(_declaredScope);
var _ExportMap = require('../ExportMap');var _ExportMap2 = _interopRequireDefault(_ExportMap);
var _importDeclaration = require('../importDeclaration');var _importDeclaration2 = _interopRequireDefault(_importDeclaration);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: (0, _docsUrl2.default)('namespace') },


    schema: [
    {
      type: 'object',
      properties: {
        allowComputed: {
          description: 'If `false`, will report computed (and thus, un-lintable) references to namespace members.',
          type: 'boolean',
          default: false } },


      additionalProperties: false }] },




  create: function namespaceRule(context) {

    // read options
    var _ref =

    context.options[0] || {},_ref$allowComputed = _ref.allowComputed;const allowComputed = _ref$allowComputed === undefined ? false : _ref$allowComputed;

    const namespaces = new Map();

    function makeMessage(last, namepath) {
      return `'${last.name}' not found in ${namepath.length > 1 ? 'deeply ' : ''}imported namespace '${namepath.join('.')}'.`;
    }

    return {
      // pick up all imports at body entry time, to properly respect hoisting
      Program(_ref2) {let body = _ref2.body;
        function processBodyStatement(declaration) {
          if (declaration.type !== 'ImportDeclaration') return;

          if (declaration.specifiers.length === 0) return;

          const imports = _ExportMap2.default.get(declaration.source.value, context);
          if (imports == null) return null;

          if (imports.errors.length) {
            imports.reportErrors(context, declaration);
            return;
          }

          for (const specifier of declaration.specifiers) {
            switch (specifier.type) {
              case 'ImportNamespaceSpecifier':
                if (!imports.size) {
                  context.report(
                  specifier,
                  `No exported names found in module '${declaration.source.value}'.`);

                }
                namespaces.set(specifier.local.name, imports);
                break;
              case 'ImportDefaultSpecifier':
              case 'ImportSpecifier':{
                  const meta = imports.get(
                  // default to 'default' for default http://i.imgur.com/nj6qAWy.jpg
                  specifier.imported ? specifier.imported.name : 'default');

                  if (!meta || !meta.namespace) {break;}
                  namespaces.set(specifier.local.name, meta.namespace);
                  break;
                }}

          }
        }
        body.forEach(processBodyStatement);
      },

      // same as above, but does not add names to local map
      ExportNamespaceSpecifier(namespace) {
        const declaration = (0, _importDeclaration2.default)(context);

        const imports = _ExportMap2.default.get(declaration.source.value, context);
        if (imports == null) return null;

        if (imports.errors.length) {
          imports.reportErrors(context, declaration);
          return;
        }

        if (!imports.size) {
          context.report(
          namespace,
          `No exported names found in module '${declaration.source.value}'.`);

        }
      },

      // todo: check for possible redefinition

      MemberExpression(dereference) {
        if (dereference.object.type !== 'Identifier') return;
        if (!namespaces.has(dereference.object.name)) return;
        if ((0, _declaredScope2.default)(context, dereference.object.name) !== 'module') return;

        if (dereference.parent.type === 'AssignmentExpression' && dereference.parent.left === dereference) {
          context.report(
          dereference.parent,
          `Assignment to member of namespace '${dereference.object.name}'.`);

        }

        // go deep
        let namespace = namespaces.get(dereference.object.name);
        const namepath = [dereference.object.name];
        // while property is namespace and parent is member expression, keep validating
        while (namespace instanceof _ExportMap2.default && dereference.type === 'MemberExpression') {

          if (dereference.computed) {
            if (!allowComputed) {
              context.report(
              dereference.property,
              `Unable to validate computed reference to imported namespace '${dereference.object.name}'.`);

            }
            return;
          }

          if (!namespace.has(dereference.property.name)) {
            context.report(
            dereference.property,
            makeMessage(dereference.property, namepath));

            break;
          }

          const exported = namespace.get(dereference.property.name);
          if (exported == null) return;

          // stash and pop
          namepath.push(dereference.property.name);
          namespace = exported.namespace;
          dereference = dereference.parent;
        }

      },

      VariableDeclarator(_ref3) {let id = _ref3.id,init = _ref3.init;
        if (init == null) return;
        if (init.type !== 'Identifier') return;
        if (!namespaces.has(init.name)) return;

        // check for redefinition in intermediate scopes
        if ((0, _declaredScope2.default)(context, init.name) !== 'module') return;

        // DFS traverse child namespaces
        function testKey(pattern, namespace) {let path = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [init.name];
          if (!(namespace instanceof _ExportMap2.default)) return;

          if (pattern.type !== 'ObjectPattern') return;

          for (const property of pattern.properties) {
            if (
            property.type === 'ExperimentalRestProperty' ||
            property.type === 'RestElement' ||
            !property.key)
            {
              continue;
            }

            if (property.key.type !== 'Identifier') {
              context.report({
                node: property,
                message: 'Only destructure top-level names.' });

              continue;
            }

            if (!namespace.has(property.key.name)) {
              context.report({
                node: property,
                message: makeMessage(property.key, path) });

              continue;
            }

            path.push(property.key.name);
            const dependencyExportMap = namespace.get(property.key.name);
            // could be null when ignored or ambiguous
            if (dependencyExportMap !== null) {
              testKey(property.value, dependencyExportMap.namespace, path);
            }
            path.pop();
          }
        }

        testKey(id, namespaces.get(init.name));
      },

      JSXMemberExpression(_ref4) {let object = _ref4.object,property = _ref4.property;
        if (!namespaces.has(object.name)) return;
        const namespace = namespaces.get(object.name);
        if (!namespace.has(property.name)) {
          context.report({
            node: property,
            message: makeMessage(property, [object.name]) });

        }
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJ0eXBlIiwiZG9jcyIsInVybCIsInNjaGVtYSIsInByb3BlcnRpZXMiLCJhbGxvd0NvbXB1dGVkIiwiZGVzY3JpcHRpb24iLCJkZWZhdWx0IiwiYWRkaXRpb25hbFByb3BlcnRpZXMiLCJjcmVhdGUiLCJuYW1lc3BhY2VSdWxlIiwiY29udGV4dCIsIm9wdGlvbnMiLCJuYW1lc3BhY2VzIiwiTWFwIiwibWFrZU1lc3NhZ2UiLCJsYXN0IiwibmFtZXBhdGgiLCJuYW1lIiwibGVuZ3RoIiwiam9pbiIsIlByb2dyYW0iLCJib2R5IiwicHJvY2Vzc0JvZHlTdGF0ZW1lbnQiLCJkZWNsYXJhdGlvbiIsInNwZWNpZmllcnMiLCJpbXBvcnRzIiwiRXhwb3J0cyIsImdldCIsInNvdXJjZSIsInZhbHVlIiwiZXJyb3JzIiwicmVwb3J0RXJyb3JzIiwic3BlY2lmaWVyIiwic2l6ZSIsInJlcG9ydCIsInNldCIsImxvY2FsIiwiaW1wb3J0ZWQiLCJuYW1lc3BhY2UiLCJmb3JFYWNoIiwiRXhwb3J0TmFtZXNwYWNlU3BlY2lmaWVyIiwiTWVtYmVyRXhwcmVzc2lvbiIsImRlcmVmZXJlbmNlIiwib2JqZWN0IiwiaGFzIiwicGFyZW50IiwibGVmdCIsImNvbXB1dGVkIiwicHJvcGVydHkiLCJleHBvcnRlZCIsInB1c2giLCJWYXJpYWJsZURlY2xhcmF0b3IiLCJpZCIsImluaXQiLCJ0ZXN0S2V5IiwicGF0dGVybiIsInBhdGgiLCJrZXkiLCJub2RlIiwibWVzc2FnZSIsImRlcGVuZGVuY3lFeHBvcnRNYXAiLCJwb3AiLCJKU1hNZW1iZXJFeHByZXNzaW9uIl0sIm1hcHBpbmdzIjoiYUFBQSxrRTtBQUNBLHlDO0FBQ0EseUQ7QUFDQSxxQzs7QUFFQUEsT0FBT0MsT0FBUCxHQUFpQjtBQUNmQyxRQUFNO0FBQ0pDLFVBQU0sU0FERjtBQUVKQyxVQUFNO0FBQ0pD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MUIsSUFBdEIsQ0FBTCxFQUFrQztBQUNsQyxjQUFNcUIsWUFBWTFCLFdBQVdlLEdBQVgsQ0FBZWdCLE9BQU8xQixJQUF0QixDQUFsQjtBQUNBLFlBQUksQ0FBQ3FCLFVBQVVNLEdBQVYsQ0FBY0ksU0FBUy9CLElBQXZCLENBQUwsRUFBbUM7QUFDakNQLGtCQUFRd0IsTUFBUixDQUFlO0FBQ2J3QixrQkFBTVYsUUFETztBQUViVyxxQkFBUzdDLFlBQVlrQyxRQUFaLEVBQXNCLENBQUNMLE9BQU8xQixJQUFSLENBQXRCLENBRkksRUFBZjs7QUFJRDtBQUNGLE9BN0tJLEVBQVA7O0FBK0tELEdBbE5jLEVBQWpCIiwiZmlsZSI6Im5hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBkZWNsYXJlZFNjb3BlIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvZGVjbGFyZWRTY29wZSc7XG5pbXBvcnQgRXhwb3J0cyBmcm9tICcuLi9FeHBvcnRNYXAnO1xuaW1wb3J0IGltcG9ydERlY2xhcmF0aW9uIGZyb20gJy4uL2ltcG9ydERlY2xhcmF0aW9uJztcbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdwcm9ibGVtJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ25hbWVzcGFjZScpLFxuICAgIH0sXG5cbiAgICBzY2hlbWE6IFtcbiAgICAgIHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhbGxvd0NvbXB1dGVkOiB7XG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0lmIGBmYWxzZWAsIHdpbGwgcmVwb3J0IGNvbXB1dGVkIChhbmQgdGh1cywgdW4tbGludGFibGUpIHJlZmVyZW5jZXMgdG8gbmFtZXNwYWNlIG1lbWJlcnMuJyxcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIG5hbWVzcGFjZVJ1bGUoY29udGV4dCkge1xuXG4gICAgLy8gcmVhZCBvcHRpb25zXG4gICAgY29uc3Qge1xuICAgICAgYWxsb3dDb21wdXRlZCA9IGZhbHNlLFxuICAgIH0gPSBjb250ZXh0Lm9wdGlvbnNbMF0gfHwge307XG5cbiAgICBjb25zdCBuYW1lc3BhY2VzID0gbmV3IE1hcCgpO1xuXG4gICAgZnVuY3Rpb24gbWFrZU1lc3NhZ2UobGFzdCwgbmFtZXBhdGgpIHtcbiAgICAgIHJldHVybiBgJyR7bGFzdC5uYW1lfScgbm90IGZvdW5kIGluICR7bmFtZXBhdGgubGVuZ3RoID4gMSA/ICdkZWVwbHkgJyA6ICcnfWltcG9ydGVkIG5hbWVzcGFjZSAnJHtuYW1lcGF0aC5qb2luKCcuJyl9Jy5gO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAvLyBwaWNrIHVwIGFsbCBpbXBvcnRzIGF0IGJvZHkgZW50cnkgdGltZSwgdG8gcHJvcGVybHkgcmVzcGVjdCBob2lzdGluZ1xuICAgICAgUHJvZ3JhbSh7IGJvZHkgfSkge1xuICAgICAgICBmdW5jdGlvbiBwcm9jZXNzQm9keVN0YXRlbWVudChkZWNsYXJhdGlvbikge1xuICAgICAgICAgIGlmIChkZWNsYXJhdGlvbi50eXBlICE9PSAnSW1wb3J0RGVjbGFyYXRpb24nKSByZXR1cm47XG5cbiAgICAgICAgICBpZiAoZGVjbGFyYXRpb24uc3BlY2lmaWVycy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgICAgICAgIGNvbnN0IGltcG9ydHMgPSBFeHBvcnRzLmdldChkZWNsYXJhdGlvbi5zb3VyY2UudmFsdWUsIGNvbnRleHQpO1xuICAgICAgICAgIGlmIChpbXBvcnRzID09IG51bGwpIHJldHVybiBudWxsO1xuXG4gICAgICAgICAgaWYgKGltcG9ydHMuZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgaW1wb3J0cy5yZXBvcnRFcnJvcnMoY29udGV4dCwgZGVjbGFyYXRpb24pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZvciAoY29uc3Qgc3BlY2lmaWVyIG9mIGRlY2xhcmF0aW9uLnNwZWNpZmllcnMpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoc3BlY2lmaWVyLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ0ltcG9ydE5hbWVzcGFjZVNwZWNpZmllcic6XG4gICAgICAgICAgICAgIGlmICghaW1wb3J0cy5zaXplKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXBvcnQoXG4gICAgICAgICAgICAgICAgICBzcGVjaWZpZXIsXG4gICAgICAgICAgICAgICAgICBgTm8gZXhwb3J0ZWQgbmFtZXMgZm91bmQgaW4gbW9kdWxlICcke2RlY2xhcmF0aW9uLnNvdXJjZS52YWx1ZX0nLmBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIG5hbWVzcGFjZXMuc2V0KHNwZWNpZmllci5sb2NhbC5uYW1lLCBpbXBvcnRzKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJzpcbiAgICAgICAgICAgIGNhc2UgJ0ltcG9ydFNwZWNpZmllcic6IHtcbiAgICAgICAgICAgICAgY29uc3QgbWV0YSA9IGltcG9ydHMuZ2V0KFxuICAgICAgICAgICAgICAgIC8vIGRlZmF1bHQgdG8gJ2RlZmF1bHQnIGZvciBkZWZhdWx0IGh0dHA6Ly9pLmltZ3VyLmNvbS9uajZxQVd5LmpwZ1xuICAgICAgICAgICAgICAgIHNwZWNpZmllci5pbXBvcnRlZCA/IHNwZWNpZmllci5pbXBvcnRlZC5uYW1lIDogJ2RlZmF1bHQnXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGlmICghbWV0YSB8fCAhbWV0YS5uYW1lc3BhY2UpIHsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgbmFtZXNwYWNlcy5zZXQoc3BlY2lmaWVyLmxvY2FsLm5hbWUsIG1ldGEubmFtZXNwYWNlKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJvZHkuZm9yRWFjaChwcm9jZXNzQm9keVN0YXRlbWVudCk7XG4gICAgICB9LFxuXG4gICAgICAvLyBzYW1lIGFzIGFib3ZlLCBidXQgZG9lcyBub3QgYWRkIG5hbWVzIHRvIGxvY2FsIG1hcFxuICAgICAgRXhwb3J0TmFtZXNwYWNlU3BlY2lmaWVyKG5hbWVzcGFjZSkge1xuICAgICAgICBjb25zdCBkZWNsYXJhdGlvbiA9IGltcG9ydERlY2xhcmF0aW9uKGNvbnRleHQpO1xuXG4gICAgICAgIGNvbnN0IGltcG9ydHMgPSBFeHBvcnRzLmdldChkZWNsYXJhdGlvbi5zb3VyY2UudmFsdWUsIGNvbnRleHQpO1xuICAgICAgICBpZiAoaW1wb3J0cyA9PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICAgICAgICBpZiAoaW1wb3J0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgaW1wb3J0cy5yZXBvcnRFcnJvcnMoY29udGV4dCwgZGVjbGFyYXRpb24pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaW1wb3J0cy5zaXplKSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoXG4gICAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgICBgTm8gZXhwb3J0ZWQgbmFtZXMgZm91bmQgaW4gbW9kdWxlICcke2RlY2xhcmF0aW9uLnNvdXJjZS52YWx1ZX0nLmBcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICAvLyB0b2RvOiBjaGVjayBmb3IgcG9zc2libGUgcmVkZWZpbml0aW9uXG5cbiAgICAgIE1lbWJlckV4cHJlc3Npb24oZGVyZWZlcmVuY2UpIHtcbiAgICAgICAgaWYgKGRlcmVmZXJlbmNlLm9iamVjdC50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVybjtcbiAgICAgICAgaWYgKCFuYW1lc3BhY2VzLmhhcyhkZXJlZmVyZW5jZS5vYmplY3QubmFtZSkpIHJldHVybjtcbiAgICAgICAgaWYgKGRlY2xhcmVkU2NvcGUoY29udGV4dCwgZGVyZWZlcmVuY2Uub2JqZWN0Lm5hbWUpICE9PSAnbW9kdWxlJykgcmV0dXJuO1xuXG4gICAgICAgIGlmIChkZXJlZmVyZW5jZS5wYXJlbnQudHlwZSA9PT0gJ0Fzc2lnbm1lbnRFeHByZXNzaW9uJyAmJiBkZXJlZmVyZW5jZS5wYXJlbnQubGVmdCA9PT0gZGVyZWZlcmVuY2UpIHtcbiAgICAgICAgICBjb250ZXh0LnJlcG9ydChcbiAgICAgICAgICAgIGRlcmVmZXJlbmNlLnBhcmVudCxcbiAgICAgICAgICAgIGBBc3NpZ25tZW50IHRvIG1lbWJlciBvZiBuYW1lc3BhY2UgJyR7ZGVyZWZlcmVuY2Uub2JqZWN0Lm5hbWV9Jy5gXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGdvIGRlZXBcbiAgICAgICAgbGV0IG5hbWVzcGFjZSA9IG5hbWVzcGFjZXMuZ2V0KGRlcmVmZXJlbmNlLm9iamVjdC5uYW1lKTtcbiAgICAgICAgY29uc3QgbmFtZXBhdGggPSBbZGVyZWZlcmVuY2Uub2JqZWN0Lm5hbWVdO1xuICAgICAgICAvLyB3aGlsZSBwcm9wZXJ0eSBpcyBuYW1lc3BhY2UgYW5kIHBhcmVudCBpcyBtZW1iZXIgZXhwcmVzc2lvbiwga2VlcCB2YWxpZGF0aW5nXG4gICAgICAgIHdoaWxlIChuYW1lc3BhY2UgaW5zdGFuY2VvZiBFeHBvcnRzICYmIGRlcmVmZXJlbmNlLnR5cGUgPT09ICdNZW1iZXJFeHByZXNzaW9uJykge1xuXG4gICAgICAgICAgaWYgKGRlcmVmZXJlbmNlLmNvbXB1dGVkKSB7XG4gICAgICAgICAgICBpZiAoIWFsbG93Q29tcHV0ZWQpIHtcbiAgICAgICAgICAgICAgY29udGV4dC5yZXBvcnQoXG4gICAgICAgICAgICAgICAgZGVyZWZlcmVuY2UucHJvcGVydHksXG4gICAgICAgICAgICAgICAgYFVuYWJsZSB0byB2YWxpZGF0ZSBjb21wdXRlZCByZWZlcmVuY2UgdG8gaW1wb3J0ZWQgbmFtZXNwYWNlICcke2RlcmVmZXJlbmNlLm9iamVjdC5uYW1lfScuYFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghbmFtZXNwYWNlLmhhcyhkZXJlZmVyZW5jZS5wcm9wZXJ0eS5uYW1lKSkge1xuICAgICAgICAgICAgY29udGV4dC5yZXBvcnQoXG4gICAgICAgICAgICAgIGRlcmVmZXJlbmNlLnByb3BlcnR5LFxuICAgICAgICAgICAgICBtYWtlTWVzc2FnZShkZXJlZmVyZW5jZS5wcm9wZXJ0eSwgbmFtZXBhdGgpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgZXhwb3J0ZWQgPSBuYW1lc3BhY2UuZ2V0KGRlcmVmZXJlbmNlLnByb3BlcnR5Lm5hbWUpO1xuICAgICAgICAgIGlmIChleHBvcnRlZCA9PSBudWxsKSByZXR1cm47XG5cbiAgICAgICAgICAvLyBzdGFzaCBhbmQgcG9wXG4gICAgICAgICAgbmFtZXBhdGgucHVzaChkZXJlZmVyZW5jZS5wcm9wZXJ0eS5uYW1lKTtcbiAgICAgICAgICBuYW1lc3BhY2UgPSBleHBvcnRlZC5uYW1lc3BhY2U7XG4gICAgICAgICAgZGVyZWZlcmVuY2UgPSBkZXJlZmVyZW5jZS5wYXJlbnQ7XG4gICAgICAgIH1cblxuICAgICAgfSxcblxuICAgICAgVmFyaWFibGVEZWNsYXJhdG9yKHsgaWQsIGluaXQgfSkge1xuICAgICAgICBpZiAoaW5pdCA9PSBudWxsKSByZXR1cm47XG4gICAgICAgIGlmIChpbml0LnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuO1xuICAgICAgICBpZiAoIW5hbWVzcGFjZXMuaGFzKGluaXQubmFtZSkpIHJldHVybjtcblxuICAgICAgICAvLyBjaGVjayBmb3IgcmVkZWZpbml0aW9uIGluIGludGVybWVkaWF0ZSBzY29wZXNcbiAgICAgICAgaWYgKGRlY2xhcmVkU2NvcGUoY29udGV4dCwgaW5pdC5uYW1lKSAhPT0gJ21vZHVsZScpIHJldHVybjtcblxuICAgICAgICAvLyBERlMgdHJhdmVyc2UgY2hpbGQgbmFtZXNwYWNlc1xuICAgICAgICBmdW5jdGlvbiB0ZXN0S2V5KHBhdHRlcm4sIG5hbWVzcGFjZSwgcGF0aCA9IFtpbml0Lm5hbWVdKSB7XG4gICAgICAgICAgaWYgKCEobmFtZXNwYWNlIGluc3RhbmNlb2YgRXhwb3J0cykpIHJldHVybjtcblxuICAgICAgICAgIGlmIChwYXR0ZXJuLnR5cGUgIT09ICdPYmplY3RQYXR0ZXJuJykgcmV0dXJuO1xuXG4gICAgICAgICAgZm9yIChjb25zdCBwcm9wZXJ0eSBvZiBwYXR0ZXJuLnByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgcHJvcGVydHkudHlwZSA9PT0gJ0V4cGVyaW1lbnRhbFJlc3RQcm9wZXJ0eSdcbiAgICAgICAgICAgICAgfHwgcHJvcGVydHkudHlwZSA9PT0gJ1Jlc3RFbGVtZW50J1xuICAgICAgICAgICAgICB8fCAhcHJvcGVydHkua2V5XG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwcm9wZXJ0eS5rZXkudHlwZSAhPT0gJ0lkZW50aWZpZXInKSB7XG4gICAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICAgICAgICBub2RlOiBwcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnT25seSBkZXN0cnVjdHVyZSB0b3AtbGV2ZWwgbmFtZXMuJyxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIW5hbWVzcGFjZS5oYXMocHJvcGVydHkua2V5Lm5hbWUpKSB7XG4gICAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICAgICAgICBub2RlOiBwcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBtYWtlTWVzc2FnZShwcm9wZXJ0eS5rZXksIHBhdGgpLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhdGgucHVzaChwcm9wZXJ0eS5rZXkubmFtZSk7XG4gICAgICAgICAgICBjb25zdCBkZXBlbmRlbmN5RXhwb3J0TWFwID0gbmFtZXNwYWNlLmdldChwcm9wZXJ0eS5rZXkubmFtZSk7XG4gICAgICAgICAgICAvLyBjb3VsZCBiZSBudWxsIHdoZW4gaWdub3JlZCBvciBhbWJpZ3VvdXNcbiAgICAgICAgICAgIGlmIChkZXBlbmRlbmN5RXhwb3J0TWFwICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIHRlc3RLZXkocHJvcGVydHkudmFsdWUsIGRlcGVuZGVuY3lFeHBvcnRNYXAubmFtZXNwYWNlLCBwYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhdGgucG9wKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGVzdEtleShpZCwgbmFtZXNwYWNlcy5nZXQoaW5pdC5uYW1lKSk7XG4gICAgICB9LFxuXG4gICAgICBKU1hNZW1iZXJFeHByZXNzaW9uKHsgb2JqZWN0LCBwcm9wZXJ0eSB9KSB7XG4gICAgICAgIGlmICghbmFtZXNwYWNlcy5oYXMob2JqZWN0Lm5hbWUpKSByZXR1cm47XG4gICAgICAgIGNvbnN0IG5hbWVzcGFjZSA9IG5hbWVzcGFjZXMuZ2V0KG9iamVjdC5uYW1lKTtcbiAgICAgICAgaWYgKCFuYW1lc3BhY2UuaGFzKHByb3BlcnR5Lm5hbWUpKSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgICAgbm9kZTogcHJvcGVydHksXG4gICAgICAgICAgICBtZXNzYWdlOiBtYWtlTWVzc2FnZShwcm9wZXJ0eSwgW29iamVjdC5uYW1lXSksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcbn07XG4iXX0=