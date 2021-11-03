'use strict';




var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);
var _moduleVisitor = require('eslint-module-utils/moduleVisitor');var _moduleVisitor2 = _interopRequireDefault(_moduleVisitor);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function isImportingSelf(context, node, requireName) {
  const filePath = context.getFilename();

  // If the input is from stdin, this test can't fail
  if (filePath !== '<text>' && filePath === (0, _resolve2.default)(requireName, context)) {
    context.report({
      node,
      message: 'Module imports itself.' });

  }
} /**
   * @fileOverview Forbids a module from importing itself
   * @author Gio d'Amelio
   */module.exports = { meta: {
    type: 'problem',
    docs: {
      description: 'Forbid a module from importing itself',
      recommended: true,
      url: (0, _docsUrl2.default)('no-self-import') },


    schema: [] },

  create: function (context) {
    return (0, _moduleVisitor2.default)((source, node) => {
      isImportingSelf(context, node, source.value);
    }, { commonjs: true });
  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1zZWxmLWltcG9ydC5qcyJdLCJuYW1lcyI6WyJpc0ltcG9ydGluZ1NlbGYiLCJjb250ZXh0Iiwibm9kZSIsInJlcXVpcmVOYW1lIiwiZmlsZVBhdGgiLCJnZXRGaWxlbmFtZSIsInJlcG9ydCIsIm1lc3NhZ2UiLCJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsInR5cGUiLCJkb2NzIiwiZGVzY3JpcHRpb24iLCJyZWNvbW1lbmRlZCIsInVybCIsInNjaGVtYSIsImNyZWF0ZSIsInNvdXJjZSIsInZhbHVlIiwiY29tbW9uanMiXSwibWFwcGluZ3MiOiI7Ozs7O0FBS0Esc0Q7QUFDQSxrRTtBQUNBLHFDOztBQUVBLFNBQVNBLGVBQVQsQ0FBeUJDLE9BQXpCLEVBQWtDQyxJQUFsQyxFQUF3Q0MsV0FBeEMsRUFBcUQ7QUFDbkQsUUFBTUMsV0FBV0gsUUFBUUksV0FBUixFQUFqQjs7QUFFQTtBQUNBLE1BQUlELGFBQWEsUUFBYixJQUF5QkEsYUFBYSx1QkFBUUQsV0FBUixFQUFxQkYsT0FBckIsQ0FBMUMsRUFBeUU7QUFDdkVBLFlBQVFLLE1BQVIsQ0FBZTtBQUNiSixVQURhO0FBRWJLLGVBQVMsd0JBRkksRUFBZjs7QUFJRDtBQUNGLEMsQ0FuQkQ7OztLQXFCQUMsT0FBT0MsT0FBUCxHQUFpQixFQUNmQyxNQUFNO0FBQ0pDLFVBQU0sU0FERjtBQUVKQyxVQUFNO0FBQ0pDLG1CQUFhLHVDQURUO0FBRUpDLG1CQUFhLElBRlQ7QUFHSkMsV0FBSyx1QkFBUSxnQkFBUixDQUhELEVBRkY7OztBQVFKQyxZQUFRLEVBUkosRUFEUzs7QUFXZkMsVUFBUSxVQUFVaEIsT0FBVixFQUFtQjtBQUN6QixXQUFPLDZCQUFjLENBQUNpQixNQUFELEVBQVNoQixJQUFULEtBQWtCO0FBQ3JDRixzQkFBZ0JDLE9BQWhCLEVBQXlCQyxJQUF6QixFQUErQmdCLE9BQU9DLEtBQXRDO0FBQ0QsS0FGTSxFQUVKLEVBQUVDLFVBQVUsSUFBWixFQUZJLENBQVA7QUFHRCxHQWZjLEVBQWpCIiwiZmlsZSI6Im5vLXNlbGYtaW1wb3J0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZU92ZXJ2aWV3IEZvcmJpZHMgYSBtb2R1bGUgZnJvbSBpbXBvcnRpbmcgaXRzZWxmXG4gKiBAYXV0aG9yIEdpbyBkJ0FtZWxpb1xuICovXG5cbmltcG9ydCByZXNvbHZlIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvcmVzb2x2ZSc7XG5pbXBvcnQgbW9kdWxlVmlzaXRvciBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL21vZHVsZVZpc2l0b3InO1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5cbmZ1bmN0aW9uIGlzSW1wb3J0aW5nU2VsZihjb250ZXh0LCBub2RlLCByZXF1aXJlTmFtZSkge1xuICBjb25zdCBmaWxlUGF0aCA9IGNvbnRleHQuZ2V0RmlsZW5hbWUoKTtcblxuICAvLyBJZiB0aGUgaW5wdXQgaXMgZnJvbSBzdGRpbiwgdGhpcyB0ZXN0IGNhbid0IGZhaWxcbiAgaWYgKGZpbGVQYXRoICE9PSAnPHRleHQ+JyAmJiBmaWxlUGF0aCA9PT0gcmVzb2x2ZShyZXF1aXJlTmFtZSwgY29udGV4dCkpIHtcbiAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICBub2RlLFxuICAgICAgbWVzc2FnZTogJ01vZHVsZSBpbXBvcnRzIGl0c2VsZi4nLFxuICAgIH0pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3Byb2JsZW0nLFxuICAgIGRvY3M6IHtcbiAgICAgIGRlc2NyaXB0aW9uOiAnRm9yYmlkIGEgbW9kdWxlIGZyb20gaW1wb3J0aW5nIGl0c2VsZicsXG4gICAgICByZWNvbW1lbmRlZDogdHJ1ZSxcbiAgICAgIHVybDogZG9jc1VybCgnbm8tc2VsZi1pbXBvcnQnKSxcbiAgICB9LFxuXG4gICAgc2NoZW1hOiBbXSxcbiAgfSxcbiAgY3JlYXRlOiBmdW5jdGlvbiAoY29udGV4dCkge1xuICAgIHJldHVybiBtb2R1bGVWaXNpdG9yKChzb3VyY2UsIG5vZGUpID0+IHtcbiAgICAgIGlzSW1wb3J0aW5nU2VsZihjb250ZXh0LCBub2RlLCBzb3VyY2UudmFsdWUpO1xuICAgIH0sIHsgY29tbW9uanM6IHRydWUgfSk7XG4gIH0sXG59O1xuIl19