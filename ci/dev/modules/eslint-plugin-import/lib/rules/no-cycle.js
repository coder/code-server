'use strict';var _slicedToArray = function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"]) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError("Invalid attempt to destructure non-iterable instance");}};}(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       * @fileOverview Ensures that no imported module imports the linted module.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       * @author Ben Mosher
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       */

var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);
var _ExportMap = require('../ExportMap');var _ExportMap2 = _interopRequireDefault(_ExportMap);
var _importType = require('../core/importType');
var _moduleVisitor = require('eslint-module-utils/moduleVisitor');var _moduleVisitor2 = _interopRequireDefault(_moduleVisitor);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _toConsumableArray(arr) {if (Array.isArray(arr)) {for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];return arr2;} else {return Array.from(arr);}}

// todo: cache cycles / deep relationships for faster repeat evaluation
module.exports = {
  meta: {
    type: 'suggestion',
    docs: { url: (0, _docsUrl2.default)('no-cycle') },
    schema: [(0, _moduleVisitor.makeOptionsSchema)({
      maxDepth: {
        oneOf: [
        {
          description: 'maximum dependency depth to traverse',
          type: 'integer',
          minimum: 1 },

        {
          enum: ['∞'],
          type: 'string' }] },



      ignoreExternal: {
        description: 'ignore external modules',
        type: 'boolean',
        default: false } })] },




  create: function (context) {
    const myPath = context.getFilename();
    if (myPath === '<text>') return {}; // can't cycle-check a non-file

    const options = context.options[0] || {};
    const maxDepth = typeof options.maxDepth === 'number' ? options.maxDepth : Infinity;
    const ignoreModule = name => options.ignoreExternal && (0, _importType.isExternalModule)(
    name,
    context.settings,
    (0, _resolve2.default)(name, context),
    context);


    function checkSourceValue(sourceNode, importer) {
      if (ignoreModule(sourceNode.value)) {
        return; // ignore external modules
      }

      if (
      importer.type === 'ImportDeclaration' && (
      // import type { Foo } (TS and Flow)
      importer.importKind === 'type' ||
      // import { type Foo } (Flow)
      importer.specifiers.every((_ref) => {let importKind = _ref.importKind;return importKind === 'type';})))

      {
        return; // ignore type imports
      }

      const imported = _ExportMap2.default.get(sourceNode.value, context);

      if (imported == null) {
        return; // no-unresolved territory
      }

      if (imported.path === myPath) {
        return; // no-self-import territory
      }

      const untraversed = [{ mget: () => imported, route: [] }];
      const traversed = new Set();
      function detectCycle(_ref2) {let mget = _ref2.mget,route = _ref2.route;
        const m = mget();
        if (m == null) return;
        if (traversed.has(m.path)) return;
        traversed.add(m.path);

        for (const _ref3 of m.imports) {var _ref4 = _slicedToArray(_ref3, 2);const path = _ref4[0];var _ref4$ = _ref4[1];const getter = _ref4$.getter;const declarations = _ref4$.declarations;
          if (traversed.has(path)) continue;
          const toTraverse = [].concat(_toConsumableArray(declarations)).filter((_ref5) => {let source = _ref5.source,isOnlyImportingTypes = _ref5.isOnlyImportingTypes;return (
              !ignoreModule(source.value) &&
              // Ignore only type imports
              !isOnlyImportingTypes);});

          /*
                                         Only report as a cycle if there are any import declarations that are considered by
                                         the rule. For example:
                                          a.ts:
                                         import { foo } from './b' // should not be reported as a cycle
                                          b.ts:
                                         import type { Bar } from './a'
                                         */


          if (path === myPath && toTraverse.length > 0) return true;
          if (route.length + 1 < maxDepth) {
            for (const _ref6 of toTraverse) {const source = _ref6.source;
              untraversed.push({ mget: getter, route: route.concat(source) });
            }
          }
        }
      }

      while (untraversed.length > 0) {
        const next = untraversed.shift(); // bfs!
        if (detectCycle(next)) {
          const message = next.route.length > 0 ?
          `Dependency cycle via ${routeString(next.route)}` :
          'Dependency cycle detected.';
          context.report(importer, message);
          return;
        }
      }
    }

    return (0, _moduleVisitor2.default)(checkSourceValue, context.options[0]);
  } };


function routeString(route) {
  return route.map(s => `${s.value}:${s.loc.start.line}`).join('=>');
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1jeWNsZS5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsInR5cGUiLCJkb2NzIiwidXJsIiwic2NoZW1hIiwibWF4RGVwdGgiLCJvbmVPZiIsImRlc2NyaXB0aW9uIiwibWluaW11bSIsImVudW0iLCJpZ25vcmVFeHRlcm5hbCIsImRlZmF1bHQiLCJjcmVhdGUiLCJjb250ZXh0IiwibXlQYXRoIiwiZ2V0RmlsZW5hbWUiLCJvcHRpb25zIiwiSW5maW5pdHkiLCJpZ25vcmVNb2R1bGUiLCJuYW1lIiwic2V0dGluZ3MiLCJjaGVja1NvdXJjZVZhbHVlIiwic291cmNlTm9kZSIsImltcG9ydGVyIiwidmFsdWUiLCJpbXBvcnRLaW5kIiwic3BlY2lmaWVycyIsImV2ZXJ5IiwiaW1wb3J0ZWQiLCJFeHBvcnRzIiwiZ2V0IiwicGF0aCIsInVudHJhdmVyc2VkIiwibWdldCIsInJvdXRlIiwidHJhdmVyc2VkIiwiU2V0IiwiZGV0ZWN0Q3ljbGUiLCJtIiwiaGFzIiwiYWRkIiwiaW1wb3J0cyIsImdldHRlciIsImRlY2xhcmF0aW9ucyIsInRvVHJhdmVyc2UiLCJmaWx0ZXIiLCJzb3VyY2UiLCJpc09ubHlJbXBvcnRpbmdUeXBlcyIsImxlbmd0aCIsInB1c2giLCJjb25jYXQiLCJuZXh0Iiwic2hpZnQiLCJtZXNzYWdlIiwicm91dGVTdHJpbmciLCJyZXBvcnQiLCJtYXAiLCJzIiwibG9jIiwic3RhcnQiLCJsaW5lIiwiam9pbiJdLCJtYXBwaW5ncyI6InNvQkFBQTs7Ozs7QUFLQSxzRDtBQUNBLHlDO0FBQ0E7QUFDQSxrRTtBQUNBLHFDOztBQUVBO0FBQ0FBLE9BQU9DLE9BQVAsR0FBaUI7QUFDZkMsUUFBTTtBQUNKQyxVQUFNLFlBREY7QUFFSkMsVUFBTSxFQUFFQyxLQUFLLHVCQUFRLFVBQVIsQ0FBUCxFQUZGO0FBR0pDLFlBQVEsQ0FBQyxzQ0FBa0I7QUFDekJDLGdCQUFVO0FBQ1JDLGVBQU87QUFDTDtB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QyxjQUFJZCxNQUFNYyxNQUFOLEdBQWUsQ0FBZixHQUFtQjNDLFFBQXZCLEVBQWlDO0FBQy9CLGdDQUF5QnVDLFVBQXpCLEVBQXFDLE9BQXhCRSxNQUF3QixTQUF4QkEsTUFBd0I7QUFDbkNkLDBCQUFZaUIsSUFBWixDQUFpQixFQUFFaEIsTUFBTVMsTUFBUixFQUFnQlIsT0FBT0EsTUFBTWdCLE1BQU4sQ0FBYUosTUFBYixDQUF2QixFQUFqQjtBQUNEO0FBQ0Y7QUFDRjtBQUNGOztBQUVELGFBQU9kLFlBQVlnQixNQUFaLEdBQXFCLENBQTVCLEVBQStCO0FBQzdCLGNBQU1HLE9BQU9uQixZQUFZb0IsS0FBWixFQUFiLENBRDZCLENBQ0s7QUFDbEMsWUFBSWYsWUFBWWMsSUFBWixDQUFKLEVBQXVCO0FBQ3JCLGdCQUFNRSxVQUFXRixLQUFLakIsS0FBTCxDQUFXYyxNQUFYLEdBQW9CLENBQXBCO0FBQ1osa0NBQXVCTSxZQUFZSCxLQUFLakIsS0FBakIsQ0FBd0IsRUFEbkM7QUFFYixzQ0FGSjtBQUdBckIsa0JBQVEwQyxNQUFSLENBQWVoQyxRQUFmLEVBQXlCOEIsT0FBekI7QUFDQTtBQUNEO0FBQ0Y7QUFDRjs7QUFFRCxXQUFPLDZCQUFjaEMsZ0JBQWQsRUFBZ0NSLFFBQVFHLE9BQVIsQ0FBZ0IsQ0FBaEIsQ0FBaEMsQ0FBUDtBQUNELEdBaEhjLEVBQWpCOzs7QUFtSEEsU0FBU3NDLFdBQVQsQ0FBcUJwQixLQUFyQixFQUE0QjtBQUMxQixTQUFPQSxNQUFNc0IsR0FBTixDQUFVQyxLQUFNLEdBQUVBLEVBQUVqQyxLQUFNLElBQUdpQyxFQUFFQyxHQUFGLENBQU1DLEtBQU4sQ0FBWUMsSUFBSyxFQUE5QyxFQUFpREMsSUFBakQsQ0FBc0QsSUFBdEQsQ0FBUDtBQUNEIiwiZmlsZSI6Im5vLWN5Y2xlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZU92ZXJ2aWV3IEVuc3VyZXMgdGhhdCBubyBpbXBvcnRlZCBtb2R1bGUgaW1wb3J0cyB0aGUgbGludGVkIG1vZHVsZS5cbiAqIEBhdXRob3IgQmVuIE1vc2hlclxuICovXG5cbmltcG9ydCByZXNvbHZlIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvcmVzb2x2ZSc7XG5pbXBvcnQgRXhwb3J0cyBmcm9tICcuLi9FeHBvcnRNYXAnO1xuaW1wb3J0IHsgaXNFeHRlcm5hbE1vZHVsZSB9IGZyb20gJy4uL2NvcmUvaW1wb3J0VHlwZSc7XG5pbXBvcnQgbW9kdWxlVmlzaXRvciwgeyBtYWtlT3B0aW9uc1NjaGVtYSB9IGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvbW9kdWxlVmlzaXRvcic7XG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJztcblxuLy8gdG9kbzogY2FjaGUgY3ljbGVzIC8gZGVlcCByZWxhdGlvbnNoaXBzIGZvciBmYXN0ZXIgcmVwZWF0IGV2YWx1YXRpb25cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3N1Z2dlc3Rpb24nLFxuICAgIGRvY3M6IHsgdXJsOiBkb2NzVXJsKCduby1jeWNsZScpIH0sXG4gICAgc2NoZW1hOiBbbWFrZU9wdGlvbnNTY2hlbWEoe1xuICAgICAgbWF4RGVwdGg6IHtcbiAgICAgICAgb25lT2Y6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ21heGltdW0gZGVwZW5kZW5jeSBkZXB0aCB0byB0cmF2ZXJzZScsXG4gICAgICAgICAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgICAgICAgICBtaW5pbXVtOiAxLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgZW51bTogWyfiiJ4nXSxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgaWdub3JlRXh0ZXJuYWw6IHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdpZ25vcmUgZXh0ZXJuYWwgbW9kdWxlcycsXG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICB9LFxuICAgIH0pXSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgY29uc3QgbXlQYXRoID0gY29udGV4dC5nZXRGaWxlbmFtZSgpO1xuICAgIGlmIChteVBhdGggPT09ICc8dGV4dD4nKSByZXR1cm4ge307IC8vIGNhbid0IGN5Y2xlLWNoZWNrIGEgbm9uLWZpbGVcblxuICAgIGNvbnN0IG9wdGlvbnMgPSBjb250ZXh0Lm9wdGlvbnNbMF0gfHwge307XG4gICAgY29uc3QgbWF4RGVwdGggPSB0eXBlb2Ygb3B0aW9ucy5tYXhEZXB0aCA9PT0gJ251bWJlcicgPyBvcHRpb25zLm1heERlcHRoIDogSW5maW5pdHk7XG4gICAgY29uc3QgaWdub3JlTW9kdWxlID0gKG5hbWUpID0+IG9wdGlvbnMuaWdub3JlRXh0ZXJuYWwgJiYgaXNFeHRlcm5hbE1vZHVsZShcbiAgICAgIG5hbWUsXG4gICAgICBjb250ZXh0LnNldHRpbmdzLFxuICAgICAgcmVzb2x2ZShuYW1lLCBjb250ZXh0KSxcbiAgICAgIGNvbnRleHRcbiAgICApO1xuXG4gICAgZnVuY3Rpb24gY2hlY2tTb3VyY2VWYWx1ZShzb3VyY2VOb2RlLCBpbXBvcnRlcikge1xuICAgICAgaWYgKGlnbm9yZU1vZHVsZShzb3VyY2VOb2RlLnZhbHVlKSkge1xuICAgICAgICByZXR1cm47IC8vIGlnbm9yZSBleHRlcm5hbCBtb2R1bGVzXG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgaW1wb3J0ZXIudHlwZSA9PT0gJ0ltcG9ydERlY2xhcmF0aW9uJyAmJiAoXG4gICAgICAgICAgLy8gaW1wb3J0IHR5cGUgeyBGb28gfSAoVFMgYW5kIEZsb3cpXG4gICAgICAgICAgaW1wb3J0ZXIuaW1wb3J0S2luZCA9PT0gJ3R5cGUnIHx8XG4gICAgICAgICAgLy8gaW1wb3J0IHsgdHlwZSBGb28gfSAoRmxvdylcbiAgICAgICAgICBpbXBvcnRlci5zcGVjaWZpZXJzLmV2ZXJ5KCh7IGltcG9ydEtpbmQgfSkgPT4gaW1wb3J0S2luZCA9PT0gJ3R5cGUnKVxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuOyAvLyBpZ25vcmUgdHlwZSBpbXBvcnRzXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGltcG9ydGVkID0gRXhwb3J0cy5nZXQoc291cmNlTm9kZS52YWx1ZSwgY29udGV4dCk7XG5cbiAgICAgIGlmIChpbXBvcnRlZCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjsgIC8vIG5vLXVucmVzb2x2ZWQgdGVycml0b3J5XG4gICAgICB9XG5cbiAgICAgIGlmIChpbXBvcnRlZC5wYXRoID09PSBteVBhdGgpIHtcbiAgICAgICAgcmV0dXJuOyAgLy8gbm8tc2VsZi1pbXBvcnQgdGVycml0b3J5XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVudHJhdmVyc2VkID0gW3sgbWdldDogKCkgPT4gaW1wb3J0ZWQsIHJvdXRlOltdIH1dO1xuICAgICAgY29uc3QgdHJhdmVyc2VkID0gbmV3IFNldCgpO1xuICAgICAgZnVuY3Rpb24gZGV0ZWN0Q3ljbGUoeyBtZ2V0LCByb3V0ZSB9KSB7XG4gICAgICAgIGNvbnN0IG0gPSBtZ2V0KCk7XG4gICAgICAgIGlmIChtID09IG51bGwpIHJldHVybjtcbiAgICAgICAgaWYgKHRyYXZlcnNlZC5oYXMobS5wYXRoKSkgcmV0dXJuO1xuICAgICAgICB0cmF2ZXJzZWQuYWRkKG0ucGF0aCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBbcGF0aCwgeyBnZXR0ZXIsIGRlY2xhcmF0aW9ucyB9XSBvZiBtLmltcG9ydHMpIHtcbiAgICAgICAgICBpZiAodHJhdmVyc2VkLmhhcyhwYXRoKSkgY29udGludWU7XG4gICAgICAgICAgY29uc3QgdG9UcmF2ZXJzZSA9IFsuLi5kZWNsYXJhdGlvbnNdLmZpbHRlcigoeyBzb3VyY2UsIGlzT25seUltcG9ydGluZ1R5cGVzIH0pID0+XG4gICAgICAgICAgICAhaWdub3JlTW9kdWxlKHNvdXJjZS52YWx1ZSkgJiZcbiAgICAgICAgICAgIC8vIElnbm9yZSBvbmx5IHR5cGUgaW1wb3J0c1xuICAgICAgICAgICAgIWlzT25seUltcG9ydGluZ1R5cGVzXG4gICAgICAgICAgKTtcbiAgICAgICAgICAvKlxuICAgICAgICAgIE9ubHkgcmVwb3J0IGFzIGEgY3ljbGUgaWYgdGhlcmUgYXJlIGFueSBpbXBvcnQgZGVjbGFyYXRpb25zIHRoYXQgYXJlIGNvbnNpZGVyZWQgYnlcbiAgICAgICAgICB0aGUgcnVsZS4gRm9yIGV4YW1wbGU6XG5cbiAgICAgICAgICBhLnRzOlxuICAgICAgICAgIGltcG9ydCB7IGZvbyB9IGZyb20gJy4vYicgLy8gc2hvdWxkIG5vdCBiZSByZXBvcnRlZCBhcyBhIGN5Y2xlXG5cbiAgICAgICAgICBiLnRzOlxuICAgICAgICAgIGltcG9ydCB0eXBlIHsgQmFyIH0gZnJvbSAnLi9hJ1xuICAgICAgICAgICovXG4gICAgICAgICAgaWYgKHBhdGggPT09IG15UGF0aCAmJiB0b1RyYXZlcnNlLmxlbmd0aCA+IDApIHJldHVybiB0cnVlO1xuICAgICAgICAgIGlmIChyb3V0ZS5sZW5ndGggKyAxIDwgbWF4RGVwdGgpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgeyBzb3VyY2UgfSBvZiB0b1RyYXZlcnNlKSB7XG4gICAgICAgICAgICAgIHVudHJhdmVyc2VkLnB1c2goeyBtZ2V0OiBnZXR0ZXIsIHJvdXRlOiByb3V0ZS5jb25jYXQoc291cmNlKSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgd2hpbGUgKHVudHJhdmVyc2VkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgbmV4dCA9IHVudHJhdmVyc2VkLnNoaWZ0KCk7IC8vIGJmcyFcbiAgICAgICAgaWYgKGRldGVjdEN5Y2xlKG5leHQpKSB7XG4gICAgICAgICAgY29uc3QgbWVzc2FnZSA9IChuZXh0LnJvdXRlLmxlbmd0aCA+IDBcbiAgICAgICAgICAgID8gYERlcGVuZGVuY3kgY3ljbGUgdmlhICR7cm91dGVTdHJpbmcobmV4dC5yb3V0ZSl9YFxuICAgICAgICAgICAgOiAnRGVwZW5kZW5jeSBjeWNsZSBkZXRlY3RlZC4nKTtcbiAgICAgICAgICBjb250ZXh0LnJlcG9ydChpbXBvcnRlciwgbWVzc2FnZSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vZHVsZVZpc2l0b3IoY2hlY2tTb3VyY2VWYWx1ZSwgY29udGV4dC5vcHRpb25zWzBdKTtcbiAgfSxcbn07XG5cbmZ1bmN0aW9uIHJvdXRlU3RyaW5nKHJvdXRlKSB7XG4gIHJldHVybiByb3V0ZS5tYXAocyA9PiBgJHtzLnZhbHVlfToke3MubG9jLnN0YXJ0LmxpbmV9YCkuam9pbignPT4nKTtcbn1cbiJdfQ==