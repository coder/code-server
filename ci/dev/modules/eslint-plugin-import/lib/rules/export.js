'use strict';var _slicedToArray = function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"]) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError("Invalid attempt to destructure non-iterable instance");}};}();var _ExportMap = require('../ExportMap');var _ExportMap2 = _interopRequireDefault(_ExportMap);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);
var _arrayIncludes = require('array-includes');var _arrayIncludes2 = _interopRequireDefault(_arrayIncludes);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

/*
                                                                                                                                                                                                          Notes on TypeScript namespaces aka TSModuleDeclaration:
                                                                                                                                                                                                          
                                                                                                                                                                                                          There are two forms:
                                                                                                                                                                                                          - active namespaces: namespace Foo {} / module Foo {}
                                                                                                                                                                                                          - ambient modules; declare module "eslint-plugin-import" {}
                                                                                                                                                                                                          
                                                                                                                                                                                                          active namespaces:
                                                                                                                                                                                                          - cannot contain a default export
                                                                                                                                                                                                          - cannot contain an export all
                                                                                                                                                                                                          - cannot contain a multi name export (export { a, b })
                                                                                                                                                                                                          - can have active namespaces nested within them
                                                                                                                                                                                                          
                                                                                                                                                                                                          ambient namespaces:
                                                                                                                                                                                                          - can only be defined in .d.ts files
                                                                                                                                                                                                          - cannot be nested within active namespaces
                                                                                                                                                                                                          - have no other restrictions
                                                                                                                                                                                                          */

const rootProgram = 'root';
const tsTypePrefix = 'type:';

/**
                               * Detect function overloads like:
                               * ```ts
                               * export function foo(a: number);
                               * export function foo(a: string);
                               * export function foo(a: number|string) { return a; }
                               * ```
                               * @param {Set<Object>} nodes
                               * @returns {boolean}
                               */
function isTypescriptFunctionOverloads(nodes) {
  const types = new Set(Array.from(nodes, node => node.parent.type));
  return (
    types.has('TSDeclareFunction') && (

    types.size === 1 ||
    types.size === 2 && types.has('FunctionDeclaration')));


}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: (0, _docsUrl2.default)('export') },

    schema: [] },


  create: function (context) {
    const namespace = new Map([[rootProgram, new Map()]]);

    function addNamed(name, node, parent, isType) {
      if (!namespace.has(parent)) {
        namespace.set(parent, new Map());
      }
      const named = namespace.get(parent);

      const key = isType ? `${tsTypePrefix}${name}` : name;
      let nodes = named.get(key);

      if (nodes == null) {
        nodes = new Set();
        named.set(key, nodes);
      }

      nodes.add(node);
    }

    function getParent(node) {
      if (node.parent && node.parent.type === 'TSModuleBlock') {
        return node.parent.parent;
      }

      // just in case somehow a non-ts namespace export declaration isn't directly
      // parented to the root Program node
      return rootProgram;
    }

    return {
      'ExportDefaultDeclaration': node => addNamed('default', node, getParent(node)),

      'ExportSpecifier': node => addNamed(
      node.exported.name,
      node.exported,
      getParent(node.parent)),


      'ExportNamedDeclaration': function (node) {
        if (node.declaration == null) return;

        const parent = getParent(node);
        // support for old TypeScript versions
        const isTypeVariableDecl = node.declaration.kind === 'type';

        if (node.declaration.id != null) {
          if ((0, _arrayIncludes2.default)([
          'TSTypeAliasDeclaration',
          'TSInterfaceDeclaration'],
          node.declaration.type)) {
            addNamed(node.declaration.id.name, node.declaration.id, parent, true);
          } else {
            addNamed(node.declaration.id.name, node.declaration.id, parent, isTypeVariableDecl);
          }
        }

        if (node.declaration.declarations != null) {
          for (const declaration of node.declaration.declarations) {
            (0, _ExportMap.recursivePatternCapture)(declaration.id, v =>
            addNamed(v.name, v, parent, isTypeVariableDecl));
          }
        }
      },

      'ExportAllDeclaration': function (node) {
        if (node.source == null) return; // not sure if this is ever true

        // `export * as X from 'path'` does not conflict
        if (node.exported && node.exported.name) return;

        const remoteExports = _ExportMap2.default.get(node.source.value, context);
        if (remoteExports == null) return;

        if (remoteExports.errors.length) {
          remoteExports.reportErrors(context, node);
          return;
        }

        const parent = getParent(node);

        let any = false;
        remoteExports.forEach((v, name) => {
          if (name !== 'default') {
            any = true; // poor man's filter
            addNamed(name, node, parent);
          }
        });

        if (!any) {
          context.report(
          node.source,
          `No named exports found in module '${node.source.value}'.`);

        }
      },

      'Program:exit': function () {
        for (const _ref of namespace) {var _ref2 = _slicedToArray(_ref, 2);const named = _ref2[1];
          for (const _ref3 of named) {var _ref4 = _slicedToArray(_ref3, 2);const name = _ref4[0];const nodes = _ref4[1];
            if (nodes.size <= 1) continue;

            if (isTypescriptFunctionOverloads(nodes)) continue;

            for (const node of nodes) {
              if (name === 'default') {
                context.report(node, 'Multiple default exports.');
              } else {
                context.report(
                node,
                `Multiple exports of name '${name.replace(tsTypePrefix, '')}'.`);

              }
            }
          }
        }
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9leHBvcnQuanMiXSwibmFtZXMiOlsicm9vdFByb2dyYW0iLCJ0c1R5cGVQcmVmaXgiLCJpc1R5cGVzY3JpcHRGdW5jdGlvbk92ZXJsb2FkcyIsIm5vZGVzIiwidHlwZXMiLCJTZXQiLCJBcnJheSIsImZyb20iLCJub2RlIiwicGFyZW50IiwidHlwZSIsImhhcyIsInNpemUiLCJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsImRvY3MiLCJ1cmwiLCJzY2hlbWEiLCJjcmVhdGUiLCJjb250ZXh0IiwibmFtZXNwYWNlIiwiTWFwIiwiYWRkTmFtZWQiLCJuYW1lIiwiaXNUeXBlIiwic2V0IiwibmFtZWQiLCJnZXQiLCJrZXkiLCJhZGQiLCJnZXRQYXJlbnQiLCJleHBvcnRlZCIsImRlY2xhcmF0aW9uIiwiaXNUeXBlVmFyaWFibGVEZWNsIiwia2luZCIsImlkIiwiZGVjbGFyYXRpb25zIiwidiIsInNvdXJjZSIsInJlbW90ZUV4cG9ydHMiLCJFeHBvcnRNYXAiLCJ2YWx1ZSIsImVycm9ycyIsImxlbmd0aCIsInJlcG9ydEVycm9ycyIsImFueSIsImZvckVhY2giLCJyZXBvcnQiLCJyZXBsYWNlIl0sIm1hcHBpbmdzIjoicW9CQUFBLHlDO0FBQ0EscUM7QUFDQSwrQzs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSxNQUFNQSxjQUFjLE1BQXBCO0FBQ0EsTUFBTUMsZUFBZSxPQUFyQjs7QUFFQTs7Ozs7Ozs7OztBQVVBLFNBQVNDLDZCQUFULENBQXVDQyxLQUF2QyxFQUE4QztBQUM1QyxRQUFNQyxRQUFRLElBQUlDLEdBQUosQ0FBUUMsTUFBTUMsSUFBTixDQUFXSixLQUFYLEVBQWtCSyxRQUFRQSxLQUFLQyxNQUFMLENBQVlDLElBQXRDLENBQVIsQ0FBZDtBQUNBO0FBQ0VOLFVBQU1PLEdBQU4sQ0FBVSxtQkFBVjs7QUFFRVAsVUFBTVEsSUFBTixLQUFlLENBQWY7QUFDQ1IsVUFBTVEsSUFBTixLQUFlLENBQWYsSUFBb0JSLE1B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QnJCLFNBQXhCLEVBQW1DLDJDQUFyQk0sS0FBcUI7QUFDakMsOEJBQTRCQSxLQUE1QixFQUFtQyw0Q0FBdkJILElBQXVCLGtCQUFqQnJCLEtBQWlCO0FBQ2pDLGdCQUFJQSxNQUFNUyxJQUFOLElBQWMsQ0FBbEIsRUFBcUI7O0FBRXJCLGdCQUFJViw4QkFBOEJDLEtBQTlCLENBQUosRUFBMEM7O0FBRTFDLGlCQUFLLE1BQU1LLElBQVgsSUFBbUJMLEtBQW5CLEVBQTBCO0FBQ3hCLGtCQUFJcUIsU0FBUyxTQUFiLEVBQXdCO0FBQ3RCSix3QkFBUTRCLE1BQVIsQ0FBZXhDLElBQWYsRUFBcUIsMkJBQXJCO0FBQ0QsZUFGRCxNQUVPO0FBQ0xZLHdCQUFRNEIsTUFBUjtBQUNFeEMsb0JBREY7QUFFRyw2Q0FBNEJnQixLQUFLeUIsT0FBTCxDQUFhaEQsWUFBYixFQUEyQixFQUEzQixDQUErQixJQUY5RDs7QUFJRDtBQUNGO0FBQ0Y7QUFDRjtBQUNGLE9BdEZJLEVBQVA7O0FBd0ZELEdBL0hjLEVBQWpCIiwiZmlsZSI6ImV4cG9ydC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBFeHBvcnRNYXAsIHsgcmVjdXJzaXZlUGF0dGVybkNhcHR1cmUgfSBmcm9tICcuLi9FeHBvcnRNYXAnO1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5pbXBvcnQgaW5jbHVkZXMgZnJvbSAnYXJyYXktaW5jbHVkZXMnO1xuXG4vKlxuTm90ZXMgb24gVHlwZVNjcmlwdCBuYW1lc3BhY2VzIGFrYSBUU01vZHVsZURlY2xhcmF0aW9uOlxuXG5UaGVyZSBhcmUgdHdvIGZvcm1zOlxuLSBhY3RpdmUgbmFtZXNwYWNlczogbmFtZXNwYWNlIEZvbyB7fSAvIG1vZHVsZSBGb28ge31cbi0gYW1iaWVudCBtb2R1bGVzOyBkZWNsYXJlIG1vZHVsZSBcImVzbGludC1wbHVnaW4taW1wb3J0XCIge31cblxuYWN0aXZlIG5hbWVzcGFjZXM6XG4tIGNhbm5vdCBjb250YWluIGEgZGVmYXVsdCBleHBvcnRcbi0gY2Fubm90IGNvbnRhaW4gYW4gZXhwb3J0IGFsbFxuLSBjYW5ub3QgY29udGFpbiBhIG11bHRpIG5hbWUgZXhwb3J0IChleHBvcnQgeyBhLCBiIH0pXG4tIGNhbiBoYXZlIGFjdGl2ZSBuYW1lc3BhY2VzIG5lc3RlZCB3aXRoaW4gdGhlbVxuXG5hbWJpZW50IG5hbWVzcGFjZXM6XG4tIGNhbiBvbmx5IGJlIGRlZmluZWQgaW4gLmQudHMgZmlsZXNcbi0gY2Fubm90IGJlIG5lc3RlZCB3aXRoaW4gYWN0aXZlIG5hbWVzcGFjZXNcbi0gaGF2ZSBubyBvdGhlciByZXN0cmljdGlvbnNcbiovXG5cbmNvbnN0IHJvb3RQcm9ncmFtID0gJ3Jvb3QnO1xuY29uc3QgdHNUeXBlUHJlZml4ID0gJ3R5cGU6JztcblxuLyoqXG4gKiBEZXRlY3QgZnVuY3Rpb24gb3ZlcmxvYWRzIGxpa2U6XG4gKiBgYGB0c1xuICogZXhwb3J0IGZ1bmN0aW9uIGZvbyhhOiBudW1iZXIpO1xuICogZXhwb3J0IGZ1bmN0aW9uIGZvbyhhOiBzdHJpbmcpO1xuICogZXhwb3J0IGZ1bmN0aW9uIGZvbyhhOiBudW1iZXJ8c3RyaW5nKSB7IHJldHVybiBhOyB9XG4gKiBgYGBcbiAqIEBwYXJhbSB7U2V0PE9iamVjdD59IG5vZGVzXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaXNUeXBlc2NyaXB0RnVuY3Rpb25PdmVybG9hZHMobm9kZXMpIHtcbiAgY29uc3QgdHlwZXMgPSBuZXcgU2V0KEFycmF5LmZyb20obm9kZXMsIG5vZGUgPT4gbm9kZS5wYXJlbnQudHlwZSkpO1xuICByZXR1cm4gKFxuICAgIHR5cGVzLmhhcygnVFNEZWNsYXJlRnVuY3Rpb24nKSAmJlxuICAgIChcbiAgICAgIHR5cGVzLnNpemUgPT09IDEgfHxcbiAgICAgICh0eXBlcy5zaXplID09PSAyICYmIHR5cGVzLmhhcygnRnVuY3Rpb25EZWNsYXJhdGlvbicpKVxuICAgIClcbiAgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICB0eXBlOiAncHJvYmxlbScsXG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCdleHBvcnQnKSxcbiAgICB9LFxuICAgIHNjaGVtYTogW10sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiAoY29udGV4dCkge1xuICAgIGNvbnN0IG5hbWVzcGFjZSA9IG5ldyBNYXAoW1tyb290UHJvZ3JhbSwgbmV3IE1hcCgpXV0pO1xuXG4gICAgZnVuY3Rpb24gYWRkTmFtZWQobmFtZSwgbm9kZSwgcGFyZW50LCBpc1R5cGUpIHtcbiAgICAgIGlmICghbmFtZXNwYWNlLmhhcyhwYXJlbnQpKSB7XG4gICAgICAgIG5hbWVzcGFjZS5zZXQocGFyZW50LCBuZXcgTWFwKCkpO1xuICAgICAgfVxuICAgICAgY29uc3QgbmFtZWQgPSBuYW1lc3BhY2UuZ2V0KHBhcmVudCk7XG5cbiAgICAgIGNvbnN0IGtleSA9IGlzVHlwZSA/IGAke3RzVHlwZVByZWZpeH0ke25hbWV9YCA6IG5hbWU7XG4gICAgICBsZXQgbm9kZXMgPSBuYW1lZC5nZXQoa2V5KTtcblxuICAgICAgaWYgKG5vZGVzID09IG51bGwpIHtcbiAgICAgICAgbm9kZXMgPSBuZXcgU2V0KCk7XG4gICAgICAgIG5hbWVkLnNldChrZXksIG5vZGVzKTtcbiAgICAgIH1cblxuICAgICAgbm9kZXMuYWRkKG5vZGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFBhcmVudChub2RlKSB7XG4gICAgICBpZiAobm9kZS5wYXJlbnQgJiYgbm9kZS5wYXJlbnQudHlwZSA9PT0gJ1RTTW9kdWxlQmxvY2snKSB7XG4gICAgICAgIHJldHVybiBub2RlLnBhcmVudC5wYXJlbnQ7XG4gICAgICB9XG5cbiAgICAgIC8vIGp1c3QgaW4gY2FzZSBzb21laG93IGEgbm9uLXRzIG5hbWVzcGFjZSBleHBvcnQgZGVjbGFyYXRpb24gaXNuJ3QgZGlyZWN0bHlcbiAgICAgIC8vIHBhcmVudGVkIHRvIHRoZSByb290IFByb2dyYW0gbm9kZVxuICAgICAgcmV0dXJuIHJvb3RQcm9ncmFtO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAnRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uJzogKG5vZGUpID0+IGFkZE5hbWVkKCdkZWZhdWx0Jywgbm9kZSwgZ2V0UGFyZW50KG5vZGUpKSxcblxuICAgICAgJ0V4cG9ydFNwZWNpZmllcic6IChub2RlKSA9PiBhZGROYW1lZChcbiAgICAgICAgbm9kZS5leHBvcnRlZC5uYW1lLFxuICAgICAgICBub2RlLmV4cG9ydGVkLFxuICAgICAgICBnZXRQYXJlbnQobm9kZS5wYXJlbnQpXG4gICAgICApLFxuXG4gICAgICAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbic6IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIGlmIChub2RlLmRlY2xhcmF0aW9uID09IG51bGwpIHJldHVybjtcblxuICAgICAgICBjb25zdCBwYXJlbnQgPSBnZXRQYXJlbnQobm9kZSk7XG4gICAgICAgIC8vIHN1cHBvcnQgZm9yIG9sZCBUeXBlU2NyaXB0IHZlcnNpb25zXG4gICAgICAgIGNvbnN0IGlzVHlwZVZhcmlhYmxlRGVjbCA9IG5vZGUuZGVjbGFyYXRpb24ua2luZCA9PT0gJ3R5cGUnO1xuXG4gICAgICAgIGlmIChub2RlLmRlY2xhcmF0aW9uLmlkICE9IG51bGwpIHtcbiAgICAgICAgICBpZiAoaW5jbHVkZXMoW1xuICAgICAgICAgICAgJ1RTVHlwZUFsaWFzRGVjbGFyYXRpb24nLFxuICAgICAgICAgICAgJ1RTSW50ZXJmYWNlRGVjbGFyYXRpb24nLFxuICAgICAgICAgIF0sIG5vZGUuZGVjbGFyYXRpb24udHlwZSkpIHtcbiAgICAgICAgICAgIGFkZE5hbWVkKG5vZGUuZGVjbGFyYXRpb24uaWQubmFtZSwgbm9kZS5kZWNsYXJhdGlvbi5pZCwgcGFyZW50LCB0cnVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWRkTmFtZWQobm9kZS5kZWNsYXJhdGlvbi5pZC5uYW1lLCBub2RlLmRlY2xhcmF0aW9uLmlkLCBwYXJlbnQsIGlzVHlwZVZhcmlhYmxlRGVjbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vZGUuZGVjbGFyYXRpb24uZGVjbGFyYXRpb25zICE9IG51bGwpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGRlY2xhcmF0aW9uIG9mIG5vZGUuZGVjbGFyYXRpb24uZGVjbGFyYXRpb25zKSB7XG4gICAgICAgICAgICByZWN1cnNpdmVQYXR0ZXJuQ2FwdHVyZShkZWNsYXJhdGlvbi5pZCwgdiA9PlxuICAgICAgICAgICAgICBhZGROYW1lZCh2Lm5hbWUsIHYsIHBhcmVudCwgaXNUeXBlVmFyaWFibGVEZWNsKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICAnRXhwb3J0QWxsRGVjbGFyYXRpb24nOiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICBpZiAobm9kZS5zb3VyY2UgPT0gbnVsbCkgcmV0dXJuOyAvLyBub3Qgc3VyZSBpZiB0aGlzIGlzIGV2ZXIgdHJ1ZVxuXG4gICAgICAgIC8vIGBleHBvcnQgKiBhcyBYIGZyb20gJ3BhdGgnYCBkb2VzIG5vdCBjb25mbGljdFxuICAgICAgICBpZiAobm9kZS5leHBvcnRlZCAmJiBub2RlLmV4cG9ydGVkLm5hbWUpIHJldHVybjtcblxuICAgICAgICBjb25zdCByZW1vdGVFeHBvcnRzID0gRXhwb3J0TWFwLmdldChub2RlLnNvdXJjZS52YWx1ZSwgY29udGV4dCk7XG4gICAgICAgIGlmIChyZW1vdGVFeHBvcnRzID09IG51bGwpIHJldHVybjtcblxuICAgICAgICBpZiAocmVtb3RlRXhwb3J0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgcmVtb3RlRXhwb3J0cy5yZXBvcnRFcnJvcnMoY29udGV4dCwgbm9kZSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyZW50ID0gZ2V0UGFyZW50KG5vZGUpO1xuXG4gICAgICAgIGxldCBhbnkgPSBmYWxzZTtcbiAgICAgICAgcmVtb3RlRXhwb3J0cy5mb3JFYWNoKCh2LCBuYW1lKSA9PiB7XG4gICAgICAgICAgaWYgKG5hbWUgIT09ICdkZWZhdWx0Jykge1xuICAgICAgICAgICAgYW55ID0gdHJ1ZTsgLy8gcG9vciBtYW4ncyBmaWx0ZXJcbiAgICAgICAgICAgIGFkZE5hbWVkKG5hbWUsIG5vZGUsIHBhcmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIWFueSkge1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KFxuICAgICAgICAgICAgbm9kZS5zb3VyY2UsXG4gICAgICAgICAgICBgTm8gbmFtZWQgZXhwb3J0cyBmb3VuZCBpbiBtb2R1bGUgJyR7bm9kZS5zb3VyY2UudmFsdWV9Jy5gXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgJ1Byb2dyYW06ZXhpdCc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yIChjb25zdCBbLCBuYW1lZF0gb2YgbmFtZXNwYWNlKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBbbmFtZSwgbm9kZXNdIG9mIG5hbWVkKSB7XG4gICAgICAgICAgICBpZiAobm9kZXMuc2l6ZSA8PSAxKSBjb250aW51ZTtcblxuICAgICAgICAgICAgaWYgKGlzVHlwZXNjcmlwdEZ1bmN0aW9uT3ZlcmxvYWRzKG5vZGVzKSkgY29udGludWU7XG5cbiAgICAgICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBub2Rlcykge1xuICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gJ2RlZmF1bHQnKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXBvcnQobm9kZSwgJ011bHRpcGxlIGRlZmF1bHQgZXhwb3J0cy4nKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlcG9ydChcbiAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgICBgTXVsdGlwbGUgZXhwb3J0cyBvZiBuYW1lICcke25hbWUucmVwbGFjZSh0c1R5cGVQcmVmaXgsICcnKX0nLmBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG59O1xuIl19