'use strict';var _minimatch = require('minimatch');var _minimatch2 = _interopRequireDefault(_minimatch);
var _path = require('path');var _path2 = _interopRequireDefault(_path);
var _pkgUp = require('pkg-up');var _pkgUp2 = _interopRequireDefault(_pkgUp);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function getEntryPoint(context) {
  const pkgPath = _pkgUp2.default.sync(context.getFilename());
  try {
    return require.resolve(_path2.default.dirname(pkgPath));
  } catch (error) {
    // Assume the package has no entrypoint (e.g. CLI packages)
    // in which case require.resolve would throw.
    return null;
  }
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow import statements with module.exports',
      category: 'Best Practices',
      recommended: true },

    fixable: 'code',
    schema: [
    {
      'type': 'object',
      'properties': {
        'exceptions': { 'type': 'array' } },

      'additionalProperties': false }] },



  create(context) {
    const importDeclarations = [];
    const entryPoint = getEntryPoint(context);
    const options = context.options[0] || {};
    let alreadyReported = false;

    function report(node) {
      const fileName = context.getFilename();
      const isEntryPoint = entryPoint === fileName;
      const isIdentifier = node.object.type === 'Identifier';
      const hasKeywords = /^(module|exports)$/.test(node.object.name);
      const isException = options.exceptions &&
      options.exceptions.some(glob => (0, _minimatch2.default)(fileName, glob));

      if (isIdentifier && hasKeywords && !isEntryPoint && !isException) {
        importDeclarations.forEach(importDeclaration => {
          context.report({
            node: importDeclaration,
            message: `Cannot use import declarations in modules that export using ` +
            `CommonJS (module.exports = 'foo' or exports.bar = 'hi')` });

        });
        alreadyReported = true;
      }
    }

    return {
      ImportDeclaration(node) {
        importDeclarations.push(node);
      },
      MemberExpression(node) {
        if (!alreadyReported) {
          report(node);
        }
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1pbXBvcnQtbW9kdWxlLWV4cG9ydHMuanMiXSwibmFtZXMiOlsiZ2V0RW50cnlQb2ludCIsImNvbnRleHQiLCJwa2dQYXRoIiwicGtnVXAiLCJzeW5jIiwiZ2V0RmlsZW5hbWUiLCJyZXF1aXJlIiwicmVzb2x2ZSIsInBhdGgiLCJkaXJuYW1lIiwiZXJyb3IiLCJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsInR5cGUiLCJkb2NzIiwiZGVzY3JpcHRpb24iLCJjYXRlZ29yeSIsInJlY29tbWVuZGVkIiwiZml4YWJsZSIsInNjaGVtYSIsImNyZWF0ZSIsImltcG9ydERlY2xhcmF0aW9ucyIsImVudHJ5UG9pbnQiLCJvcHRpb25zIiwiYWxyZWFkeVJlcG9ydGVkIiwicmVwb3J0Iiwibm9kZSIsImZpbGVOYW1lIiwiaXNFbnRyeVBvaW50IiwiaXNJZGVudGlmaWVyIiwib2JqZWN0IiwiaGFzS2V5d29yZHMiLCJ0ZXN0IiwibmFtZSIsImlzRXhjZXB0aW9uIiwiZXhjZXB0aW9ucyIsInNvbWUiLCJnbG9iIiwiZm9yRWFjaCIsImltcG9ydERlY2xhcmF0aW9uIiwibWVzc2FnZSIsIkltcG9ydERlY2xhcmF0aW9uIiwicHVzaCIsIk1lbWJlckV4cHJlc3Npb24iXSwibWFwcGluZ3MiOiJhQUFBLHNDO0FBQ0EsNEI7QUFDQSwrQjs7QUFFQSxTQUFTQSxhQUFULENBQXVCQyxPQUF2QixFQUFnQztBQUM5QixRQUFNQyxVQUFVQyxnQkFBTUMsSUFBTixDQUFXSCxRQUFRSSxXQUFSLEVBQVgsQ0FBaEI7QUFDQSxNQUFJO0FBQ0YsV0FBT0MsUUFBUUMsT0FBUixDQUFnQkMsZUFBS0MsT0FBTCxDQUFhUCxPQUFiLENBQWhCLENBQVA7QUFDRCxHQUZELENBRUUsT0FBT1EsS0FBUCxFQUFjO0FBQ2Q7QUFDQTtBQUNBLFdBQU8sSUFBUDtBQUNEO0FBQ0Y7O0FBRURDLE9BQU9DLE9BQVAsR0FBaUI7QUFDZkMsUUFBTTtBQUNKQyxVQUFNLFNBREY7QUFFSkMsVUFBTTtBQUNKQyxtQkFBYSxnREFEVDtBQUVKQyxnQkFBVSxnQkFGTjtBQUdKQyxtQkFBYSxJQUhULEVBRkY7O0FBT0pDLGFBQVMsTUFQTDtBQVFKQyxZQUFRO0FBQ047QUFDRSxjQUFRLFFBRFY7QUFFRSxvQkFBYztBQUNaLHNCQUFjLEVBQUUsUUFBUSxPQUFWLEVBREYsRUFGaEI7O0FBS0UsOEJBQXdCLEtBTDFCLEVBRE0sQ0FSSixFQURTOzs7O0FBbUJmQyxTQUFPcEIsT0FBUCxFQUFnQjtBQUNkLFVBQU1xQixxQkFBcUIsRUFBM0I7QUFDQSxVQUFNQyxhQUFhdkIsY0FBY0MsT0FBZCxDQUFuQjtBQUNBLFVBQU11QixVQUFVdkIsUUFBUXVCLE9BQVIsQ0FBZ0IsQ0FBaEIsS0FBc0IsRUFBdEM7QUFDQSxRQUFJQyxrQkFBa0IsS0FBdEI7O0FBRUEsYUFBU0MsTUFBVCxDQUFnQkMsSUFBaEIsRUFBc0I7QUFDcEIsWUFBTUMsV0FBVzNCLFFBQVFJLFdBQVIsRUFBakI7QUFDQSxZQUFNd0IsZUFBZU4sZUFBZUssUUFBcEM7QUFDQSxZQUFNRSxlQUFlSCxLQUFLSSxNQUFMLENBQVlqQixJQUFaLEtBQXFCLFlBQTFDO0FBQ0EsWUFBTWtCLGNBQWUsb0JBQUQsQ0FBdUJDLElBQXZCLENBQTRCTixLQUFLSSxNQUFMLENBQVlHLElBQXhDLENBQXBCO0FBQ0EsWUFBTUMsY0FBY1gsUUFBUVksVUFBUjtBQUNsQlosY0FBUVksVUFBUixDQUFtQkMsSUFBbkIsQ0FBd0JDLFFBQVEseUJBQVVWLFFBQVYsRUFBb0JVLElBQXBCLENBQWhDLENBREY7O0FBR0EsVUFBSVIsZ0JBQWdCRSxXQUFoQixJQUErQixDQUFDSCxZQUFoQyxJQUFnRCxDQUFDTSxXQUFyRCxFQUFrRTtBQUNoRWIsMkJBQW1CaUIsT0FBbkIsQ0FBMkJDLHFCQUFxQjtBQUM5Q3ZDLGtCQUFReUIsTUFBUixDQUFlO0FBQ2JDLGtCQUFNYSxpQkFETztBQUViQyxxQkFBVSw4REFBRDtBQUNOLHFFQUhVLEVBQWY7O0FBS0QsU0FORDtBQU9BaEIsMEJBQWtCLElBQWxCO0FBQ0Q7QUFDRjs7QUFFRCxXQUFPO0FBQ0xpQix3QkFBa0JmLElBQWxCLEVBQXdCO0FBQ3RCTCwyQkFBbUJxQixJQUFuQixDQUF3QmhCLElBQXhCO0FBQ0QsT0FISTtBQUlMaUIsdUJBQWlCakIsSUFBakIsRUFBdUI7QUFDckIsWUFBSSxDQUFDRixlQUFMLEVBQXNCO0FBQ3BCQyxpQkFBT0MsSUFBUDtBQUNEO0FBQ0YsT0FSSSxFQUFQOztBQVVELEdBdkRjLEVBQWpCIiwiZmlsZSI6Im5vLWltcG9ydC1tb2R1bGUtZXhwb3J0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtaW5pbWF0Y2ggZnJvbSAnbWluaW1hdGNoJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHBrZ1VwIGZyb20gJ3BrZy11cCc7XG5cbmZ1bmN0aW9uIGdldEVudHJ5UG9pbnQoY29udGV4dCkge1xuICBjb25zdCBwa2dQYXRoID0gcGtnVXAuc3luYyhjb250ZXh0LmdldEZpbGVuYW1lKCkpO1xuICB0cnkge1xuICAgIHJldHVybiByZXF1aXJlLnJlc29sdmUocGF0aC5kaXJuYW1lKHBrZ1BhdGgpKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBBc3N1bWUgdGhlIHBhY2thZ2UgaGFzIG5vIGVudHJ5cG9pbnQgKGUuZy4gQ0xJIHBhY2thZ2VzKVxuICAgIC8vIGluIHdoaWNoIGNhc2UgcmVxdWlyZS5yZXNvbHZlIHdvdWxkIHRocm93LlxuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3Byb2JsZW0nLFxuICAgIGRvY3M6IHtcbiAgICAgIGRlc2NyaXB0aW9uOiAnRGlzYWxsb3cgaW1wb3J0IHN0YXRlbWVudHMgd2l0aCBtb2R1bGUuZXhwb3J0cycsXG4gICAgICBjYXRlZ29yeTogJ0Jlc3QgUHJhY3RpY2VzJyxcbiAgICAgIHJlY29tbWVuZGVkOiB0cnVlLFxuICAgIH0sXG4gICAgZml4YWJsZTogJ2NvZGUnLFxuICAgIHNjaGVtYTogW1xuICAgICAge1xuICAgICAgICAndHlwZSc6ICdvYmplY3QnLFxuICAgICAgICAncHJvcGVydGllcyc6IHtcbiAgICAgICAgICAnZXhjZXB0aW9ucyc6IHsgJ3R5cGUnOiAnYXJyYXknIH0sXG4gICAgICAgIH0sXG4gICAgICAgICdhZGRpdGlvbmFsUHJvcGVydGllcyc6IGZhbHNlLFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxuICBjcmVhdGUoY29udGV4dCkge1xuICAgIGNvbnN0IGltcG9ydERlY2xhcmF0aW9ucyA9IFtdO1xuICAgIGNvbnN0IGVudHJ5UG9pbnQgPSBnZXRFbnRyeVBvaW50KGNvbnRleHQpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBjb250ZXh0Lm9wdGlvbnNbMF0gfHwge307XG4gICAgbGV0IGFscmVhZHlSZXBvcnRlZCA9IGZhbHNlO1xuXG4gICAgZnVuY3Rpb24gcmVwb3J0KG5vZGUpIHtcbiAgICAgIGNvbnN0IGZpbGVOYW1lID0gY29udGV4dC5nZXRGaWxlbmFtZSgpO1xuICAgICAgY29uc3QgaXNFbnRyeVBvaW50ID0gZW50cnlQb2ludCA9PT0gZmlsZU5hbWU7XG4gICAgICBjb25zdCBpc0lkZW50aWZpZXIgPSBub2RlLm9iamVjdC50eXBlID09PSAnSWRlbnRpZmllcic7XG4gICAgICBjb25zdCBoYXNLZXl3b3JkcyA9ICgvXihtb2R1bGV8ZXhwb3J0cykkLykudGVzdChub2RlLm9iamVjdC5uYW1lKTtcbiAgICAgIGNvbnN0IGlzRXhjZXB0aW9uID0gb3B0aW9ucy5leGNlcHRpb25zICYmXG4gICAgICAgIG9wdGlvbnMuZXhjZXB0aW9ucy5zb21lKGdsb2IgPT4gbWluaW1hdGNoKGZpbGVOYW1lLCBnbG9iKSk7XG5cbiAgICAgIGlmIChpc0lkZW50aWZpZXIgJiYgaGFzS2V5d29yZHMgJiYgIWlzRW50cnlQb2ludCAmJiAhaXNFeGNlcHRpb24pIHtcbiAgICAgICAgaW1wb3J0RGVjbGFyYXRpb25zLmZvckVhY2goaW1wb3J0RGVjbGFyYXRpb24gPT4ge1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICAgIG5vZGU6IGltcG9ydERlY2xhcmF0aW9uLFxuICAgICAgICAgICAgbWVzc2FnZTogYENhbm5vdCB1c2UgaW1wb3J0IGRlY2xhcmF0aW9ucyBpbiBtb2R1bGVzIHRoYXQgZXhwb3J0IHVzaW5nIGAgK1xuICAgICAgICAgICAgICBgQ29tbW9uSlMgKG1vZHVsZS5leHBvcnRzID0gJ2Zvbycgb3IgZXhwb3J0cy5iYXIgPSAnaGknKWAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBhbHJlYWR5UmVwb3J0ZWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBJbXBvcnREZWNsYXJhdGlvbihub2RlKSB7XG4gICAgICAgIGltcG9ydERlY2xhcmF0aW9ucy5wdXNoKG5vZGUpO1xuICAgICAgfSxcbiAgICAgIE1lbWJlckV4cHJlc3Npb24obm9kZSkge1xuICAgICAgICBpZiAoIWFscmVhZHlSZXBvcnRlZCkge1xuICAgICAgICAgIHJlcG9ydChub2RlKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9O1xuICB9LFxufTtcbiJdfQ==