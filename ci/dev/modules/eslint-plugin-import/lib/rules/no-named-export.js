'use strict';var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: { url: (0, _docsUrl2.default)('no-named-export') },
    schema: [] },


  create(context) {
    // ignore non-modules
    if (context.parserOptions.sourceType !== 'module') {
      return {};
    }

    const message = 'Named exports are not allowed.';

    return {
      ExportAllDeclaration(node) {
        context.report({ node, message });
      },

      ExportNamedDeclaration(node) {
        if (node.specifiers.length === 0) {
          return context.report({ node, message });
        }

        const someNamed = node.specifiers.some(specifier => specifier.exported.name !== 'default');
        if (someNamed) {
          context.report({ node, message });
        }
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1uYW1lZC1leHBvcnQuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJ0eXBlIiwiZG9jcyIsInVybCIsInNjaGVtYSIsImNyZWF0ZSIsImNvbnRleHQiLCJwYXJzZXJPcHRpb25zIiwic291cmNlVHlwZSIsIm1lc3NhZ2UiLCJFeHBvcnRBbGxEZWNsYXJhdGlvbiIsIm5vZGUiLCJyZXBvcnQiLCJFeHBvcnROYW1lZERlY2xhcmF0aW9uIiwic3BlY2lmaWVycyIsImxlbmd0aCIsInNvbWVOYW1lZCIsInNvbWUiLCJzcGVjaWZpZXIiLCJleHBvcnRlZCIsIm5hbWUiXSwibWFwcGluZ3MiOiJhQUFBLHFDOztBQUVBQSxPQUFPQyxPQUFQLEdBQWlCO0FBQ2ZDLFFBQU07QUFDSkMsVUFBTSxZQURGO0FBRUpDLFVBQU0sRUFBRUMsS0FBSyx1QkFBUSxpQkFBUixDQUFQLEVBRkY7QUFHSkMsWUFBUSxFQUhKLEVBRFM7OztBQU9mQyxTQUFPQyxPQUFQLEVBQWdCO0FBQ2Q7QUFDQSxRQUFJQSxRQUFRQyxhQUFSLENBQXNCQyxVQUF0QixLQUFxQyxRQUF6QyxFQUFtRDtBQUNqRCxhQUFPLEVBQVA7QUFDRDs7QUFFRCxVQUFNQyxVQUFVLGdDQUFoQjs7QUFFQSxXQUFPO0FBQ0xDLDJCQUFxQkMsSUFBckIsRUFBMkI7QUFDekJMLGdCQUFRTSxNQUFSLENBQWUsRUFBRUQsSUFBRixFQUFRRixPQUFSLEVBQWY7QUFDRCxPQUhJOztBQUtMSSw2QkFBdUJGLElBQXZCLEVBQTZCO0FBQzNCLFlBQUlBLEtBQUtHLFVBQUwsQ0FBZ0JDLE1BQWhCLEtBQTJCLENBQS9CLEVBQWtDO0FBQ2hDLGlCQUFPVCxRQUFRTSxNQUFSLENBQWUsRUFBRUQsSUFBRixFQUFRRixPQUFSLEVBQWYsQ0FBUDtBQUNEOztBQUVELGNBQU1PLFlBQVlMLEtBQUtHLFVBQUwsQ0FBZ0JHLElBQWhCLENBQXFCQyxhQUFhQSxVQUFVQyxRQUFWLENBQW1CQyxJQUFuQixLQUE0QixTQUE5RCxDQUFsQjtBQUNBLFlBQUlKLFNBQUosRUFBZTtBQUNiVixrQkFBUU0sTUFBUixDQUFlLEVBQUVELElBQUYsRUFBUUYsT0FBUixFQUFmO0FBQ0Q7QUFDRixPQWRJLEVBQVA7O0FBZ0JELEdBL0JjLEVBQWpCIiwiZmlsZSI6Im5vLW5hbWVkLWV4cG9ydC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7IHVybDogZG9jc1VybCgnbm8tbmFtZWQtZXhwb3J0JykgfSxcbiAgICBzY2hlbWE6IFtdLFxuICB9LFxuXG4gIGNyZWF0ZShjb250ZXh0KSB7XG4gICAgLy8gaWdub3JlIG5vbi1tb2R1bGVzXG4gICAgaWYgKGNvbnRleHQucGFyc2VyT3B0aW9ucy5zb3VyY2VUeXBlICE9PSAnbW9kdWxlJykge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIGNvbnN0IG1lc3NhZ2UgPSAnTmFtZWQgZXhwb3J0cyBhcmUgbm90IGFsbG93ZWQuJztcblxuICAgIHJldHVybiB7XG4gICAgICBFeHBvcnRBbGxEZWNsYXJhdGlvbihub2RlKSB7XG4gICAgICAgIGNvbnRleHQucmVwb3J0KHsgbm9kZSwgbWVzc2FnZSB9KTtcbiAgICAgIH0sXG5cbiAgICAgIEV4cG9ydE5hbWVkRGVjbGFyYXRpb24obm9kZSkge1xuICAgICAgICBpZiAobm9kZS5zcGVjaWZpZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHJldHVybiBjb250ZXh0LnJlcG9ydCh7IG5vZGUsIG1lc3NhZ2UgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzb21lTmFtZWQgPSBub2RlLnNwZWNpZmllcnMuc29tZShzcGVjaWZpZXIgPT4gc3BlY2lmaWVyLmV4cG9ydGVkLm5hbWUgIT09ICdkZWZhdWx0Jyk7XG4gICAgICAgIGlmIChzb21lTmFtZWQpIHtcbiAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7IG5vZGUsIG1lc3NhZ2UgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcbn07XG4iXX0=