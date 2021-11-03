'use strict';




var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);
var _ModuleCache = require('eslint-module-utils/ModuleCache');var _ModuleCache2 = _interopRequireDefault(_ModuleCache);
var _moduleVisitor = require('eslint-module-utils/moduleVisitor');var _moduleVisitor2 = _interopRequireDefault(_moduleVisitor);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /**
                                                                                                                                                                                     * @fileOverview Ensures that an imported path exists, given resolution rules.
                                                                                                                                                                                     * @author Ben Mosher
                                                                                                                                                                                     */module.exports = { meta: {
    type: 'problem',
    docs: {
      url: (0, _docsUrl2.default)('no-unresolved') },


    schema: [(0, _moduleVisitor.makeOptionsSchema)({
      caseSensitive: { type: 'boolean', default: true } })] },



  create: function (context) {

    function checkSourceValue(source) {
      const shouldCheckCase = !_resolve.CASE_SENSITIVE_FS && (
      !context.options[0] || context.options[0].caseSensitive !== false);

      const resolvedPath = (0, _resolve2.default)(source.value, context);

      if (resolvedPath === undefined) {
        context.report(source,
        `Unable to resolve path to module '${source.value}'.`);
      } else

      if (shouldCheckCase) {
        const cacheSettings = _ModuleCache2.default.getSettings(context.settings);
        if (!(0, _resolve.fileExistsWithCaseSync)(resolvedPath, cacheSettings)) {
          context.report(source,
          `Casing of ${source.value} does not match the underlying filesystem.`);
        }

      }
    }

    return (0, _moduleVisitor2.default)(checkSourceValue, context.options[0]);

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby11bnJlc29sdmVkLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwidHlwZSIsImRvY3MiLCJ1cmwiLCJzY2hlbWEiLCJjYXNlU2Vuc2l0aXZlIiwiZGVmYXVsdCIsImNyZWF0ZSIsImNvbnRleHQiLCJjaGVja1NvdXJjZVZhbHVlIiwic291cmNlIiwic2hvdWxkQ2hlY2tDYXNlIiwiQ0FTRV9TRU5TSVRJVkVfRlMiLCJvcHRpb25zIiwicmVzb2x2ZWRQYXRoIiwidmFsdWUiLCJ1bmRlZmluZWQiLCJyZXBvcnQiLCJjYWNoZVNldHRpbmdzIiwiTW9kdWxlQ2FjaGUiLCJnZXRTZXR0aW5ncyIsInNldHRpbmdzIl0sIm1hcHBpbmdzIjoiOzs7OztBQUtBLHNEO0FBQ0EsOEQ7QUFDQSxrRTtBQUNBLHFDLCtJQVJBOzs7dUxBVUFBLE9BQU9DLE9BQVAsR0FBaUIsRUFDZkMsTUFBTTtBQUNKQyxVQUFNLFNBREY7QUFFSkMsVUFBTTtBQUNKQyxXQUFLLHVCQUFRLGVBQVIsQ0FERCxFQUZGOzs7QUFNSkMsWUFBUSxDQUFFLHNDQUFrQjtBQUMxQkMscUJBQWUsRUFBRUosTUFBTSxTQUFSLEVBQW1CSyxTQUFTLElBQTVCLEVBRFcsRUFBbEIsQ0FBRixDQU5KLEVBRFM7Ozs7QUFZZkMsVUFBUSxVQUFVQyxPQUFWLEVBQW1COztBQUV6QixhQUFTQyxnQkFBVCxDQUEwQkMsTUFBMUIsRUFBa0M7QUFDaEMsWUFBTUMsa0JBQWtCLENBQUNDLDBCQUFEO0FBQ3JCLE9BQUNKLFFBQVFLLE9BQVIsQ0FBZ0IsQ0FBaEIsQ0FBRCxJQUF1QkwsUUFBUUssT0FBUixDQUFnQixDQUFoQixFQUFtQlIsYUFBbkIsS0FBcUMsS0FEdkMsQ0FBeEI7O0FBR0EsWUFBTVMsZUFBZSx1QkFBUUosT0FBT0ssS0FBZixFQUFzQlAsT0FBdEIsQ0FBckI7O0FBRUEsVUFBSU0saUJBQWlCRSxTQUFyQixFQUFnQztBQUM5QlIsZ0JBQVFTLE1BQVIsQ0FBZVAsTUFBZjtBQUNHLDZDQUFvQ0EsT0FBT0ssS0FBTSxJQURwRDtBQUVELE9BSEQ7O0FBS0ssVUFBSUosZUFBSixFQUFxQjtBQUN4QixjQUFNTyxnQkFBZ0JDLHNCQUFZQyxXQUFaLENBQXdCWixRQUFRYSxRQUFoQyxDQUF0QjtBQUNBLFlBQUksQ0FBQyxxQ0FBdUJQLFlBQXZCLEVBQXFDSSxhQUFyQyxDQUFMLEVBQTBEO0FBQ3hEVixrQkFBUVMsTUFBUixDQUFlUCxNQUFmO0FBQ0csdUJBQVlBLE9BQU9LLEtBQU0sNENBRDVCO0FBRUQ7O0FBRUY7QUFDRjs7QUFFRCxXQUFPLDZCQUFjTixnQkFBZCxFQUFnQ0QsUUFBUUssT0FBUixDQUFnQixDQUFoQixDQUFoQyxDQUFQOztBQUVELEdBckNjLEVBQWpCIiwiZmlsZSI6Im5vLXVucmVzb2x2ZWQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBmaWxlT3ZlcnZpZXcgRW5zdXJlcyB0aGF0IGFuIGltcG9ydGVkIHBhdGggZXhpc3RzLCBnaXZlbiByZXNvbHV0aW9uIHJ1bGVzLlxuICogQGF1dGhvciBCZW4gTW9zaGVyXG4gKi9cblxuaW1wb3J0IHJlc29sdmUsIHsgQ0FTRV9TRU5TSVRJVkVfRlMsIGZpbGVFeGlzdHNXaXRoQ2FzZVN5bmMgfSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL3Jlc29sdmUnO1xuaW1wb3J0IE1vZHVsZUNhY2hlIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvTW9kdWxlQ2FjaGUnO1xuaW1wb3J0IG1vZHVsZVZpc2l0b3IsIHsgbWFrZU9wdGlvbnNTY2hlbWEgfSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL21vZHVsZVZpc2l0b3InO1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3Byb2JsZW0nLFxuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgnbm8tdW5yZXNvbHZlZCcpLFxuICAgIH0sXG5cbiAgICBzY2hlbWE6IFsgbWFrZU9wdGlvbnNTY2hlbWEoe1xuICAgICAgY2FzZVNlbnNpdGl2ZTogeyB0eXBlOiAnYm9vbGVhbicsIGRlZmF1bHQ6IHRydWUgfSxcbiAgICB9KV0sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiAoY29udGV4dCkge1xuXG4gICAgZnVuY3Rpb24gY2hlY2tTb3VyY2VWYWx1ZShzb3VyY2UpIHtcbiAgICAgIGNvbnN0IHNob3VsZENoZWNrQ2FzZSA9ICFDQVNFX1NFTlNJVElWRV9GUyAmJlxuICAgICAgICAoIWNvbnRleHQub3B0aW9uc1swXSB8fCBjb250ZXh0Lm9wdGlvbnNbMF0uY2FzZVNlbnNpdGl2ZSAhPT0gZmFsc2UpO1xuXG4gICAgICBjb25zdCByZXNvbHZlZFBhdGggPSByZXNvbHZlKHNvdXJjZS52YWx1ZSwgY29udGV4dCk7XG5cbiAgICAgIGlmIChyZXNvbHZlZFBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250ZXh0LnJlcG9ydChzb3VyY2UsXG4gICAgICAgICAgYFVuYWJsZSB0byByZXNvbHZlIHBhdGggdG8gbW9kdWxlICcke3NvdXJjZS52YWx1ZX0nLmApO1xuICAgICAgfVxuXG4gICAgICBlbHNlIGlmIChzaG91bGRDaGVja0Nhc2UpIHtcbiAgICAgICAgY29uc3QgY2FjaGVTZXR0aW5ncyA9IE1vZHVsZUNhY2hlLmdldFNldHRpbmdzKGNvbnRleHQuc2V0dGluZ3MpO1xuICAgICAgICBpZiAoIWZpbGVFeGlzdHNXaXRoQ2FzZVN5bmMocmVzb2x2ZWRQYXRoLCBjYWNoZVNldHRpbmdzKSkge1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KHNvdXJjZSxcbiAgICAgICAgICAgIGBDYXNpbmcgb2YgJHtzb3VyY2UudmFsdWV9IGRvZXMgbm90IG1hdGNoIHRoZSB1bmRlcmx5aW5nIGZpbGVzeXN0ZW0uYCk7XG4gICAgICAgIH1cblxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBtb2R1bGVWaXNpdG9yKGNoZWNrU291cmNlVmFsdWUsIGNvbnRleHQub3B0aW9uc1swXSk7XG5cbiAgfSxcbn07XG4iXX0=