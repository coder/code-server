'use strict';var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function isNonExportStatement(_ref) {let type = _ref.type;
  return type !== 'ExportDefaultDeclaration' &&
  type !== 'ExportNamedDeclaration' &&
  type !== 'ExportAllDeclaration';
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('exports-last') },

    schema: [] },


  create: function (context) {
    return {
      Program: function (_ref2) {let body = _ref2.body;
        const lastNonExportStatementIndex = body.reduce(function findLastIndex(acc, item, index) {
          if (isNonExportStatement(item)) {
            return index;
          }
          return acc;
        }, -1);

        if (lastNonExportStatementIndex !== -1) {
          body.slice(0, lastNonExportStatementIndex).forEach(function checkNonExport(node) {
            if (!isNonExportStatement(node)) {
              context.report({
                node,
                message: 'Export statements should appear at the end of the file' });

            }
          });
        }
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9leHBvcnRzLWxhc3QuanMiXSwibmFtZXMiOlsiaXNOb25FeHBvcnRTdGF0ZW1lbnQiLCJ0eXBlIiwibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJkb2NzIiwidXJsIiwic2NoZW1hIiwiY3JlYXRlIiwiY29udGV4dCIsIlByb2dyYW0iLCJib2R5IiwibGFzdE5vbkV4cG9ydFN0YXRlbWVudEluZGV4IiwicmVkdWNlIiwiZmluZExhc3RJbmRleCIsImFjYyIsIml0ZW0iLCJpbmRleCIsInNsaWNlIiwiZm9yRWFjaCIsImNoZWNrTm9uRXhwb3J0Iiwibm9kZSIsInJlcG9ydCIsIm1lc3NhZ2UiXSwibWFwcGluZ3MiOiJhQUFBLHFDOztBQUVBLFNBQVNBLG9CQUFULE9BQXdDLEtBQVJDLElBQVEsUUFBUkEsSUFBUTtBQUN0QyxTQUFPQSxTQUFTLDBCQUFUO0FBQ0xBLFdBQVMsd0JBREo7QUFFTEEsV0FBUyxzQkFGWDtBQUdEOztBQUVEQyxPQUFPQyxPQUFQLEdBQWlCO0FBQ2ZDLFFBQU07QUFDSkgsVUFBTSxZQURGO0FBRUpJLFVBQU07QUFDSkMsV0FBSyx1QkFBUSxjQUFSLENBREQsRUFGRjs7QUFLSkMsWUFBUSxFQUxKLEVBRFM7OztBQVNmQyxVQUFRLFVBQVVDLE9BQVYsRUFBbUI7QUFDekIsV0FBTztBQUNMQyxlQUFTLGlCQUFvQixLQUFSQyxJQUFRLFNBQVJBLElBQVE7QUFDM0IsY0FBTUMsOEJBQThCRCxLQUFLRSxNQUFMLENBQVksU0FBU0MsYUFBVCxDQUF1QkMsR0FBdkIsRUFBNEJDLElBQTVCLEVBQWtDQyxLQUFsQyxFQUF5QztBQUN2RixjQUFJakIscUJBQXFCZ0IsSUFBckIsQ0FBSixFQUFnQztBQUM5QixtQkFBT0MsS0FBUDtBQUNEO0FBQ0QsaUJBQU9GLEdBQVA7QUFDRCxTQUxtQyxFQUtqQyxDQUFDLENBTGdDLENBQXBDOztBQU9BLFlBQUlILGdDQUFnQyxDQUFDLENBQXJDLEVBQXdDO0FBQ3RDRCxlQUFLTyxLQUFMLENBQVcsQ0FBWCxFQUFjTiwyQkFBZCxFQUEyQ08sT0FBM0MsQ0FBbUQsU0FBU0MsY0FBVCxDQUF3QkMsSUFBeEIsRUFBOEI7QUFDL0UsZ0JBQUksQ0FBQ3JCLHFCQUFxQnFCLElBQXJCLENBQUwsRUFBaUM7QUFDL0JaLHNCQUFRYSxNQUFSLENBQWU7QUFDYkQsb0JBRGE7QUFFYkUseUJBQVMsd0RBRkksRUFBZjs7QUFJRDtBQUNGLFdBUEQ7QUFRRDtBQUNGLE9BbkJJLEVBQVA7O0FBcUJELEdBL0JjLEVBQWpCIiwiZmlsZSI6ImV4cG9ydHMtbGFzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnO1xuXG5mdW5jdGlvbiBpc05vbkV4cG9ydFN0YXRlbWVudCh7IHR5cGUgfSkge1xuICByZXR1cm4gdHlwZSAhPT0gJ0V4cG9ydERlZmF1bHREZWNsYXJhdGlvbicgJiZcbiAgICB0eXBlICE9PSAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbicgJiZcbiAgICB0eXBlICE9PSAnRXhwb3J0QWxsRGVjbGFyYXRpb24nO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ2V4cG9ydHMtbGFzdCcpLFxuICAgIH0sXG4gICAgc2NoZW1hOiBbXSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIFByb2dyYW06IGZ1bmN0aW9uICh7IGJvZHkgfSkge1xuICAgICAgICBjb25zdCBsYXN0Tm9uRXhwb3J0U3RhdGVtZW50SW5kZXggPSBib2R5LnJlZHVjZShmdW5jdGlvbiBmaW5kTGFzdEluZGV4KGFjYywgaXRlbSwgaW5kZXgpIHtcbiAgICAgICAgICBpZiAoaXNOb25FeHBvcnRTdGF0ZW1lbnQoaXRlbSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfSwgLTEpO1xuXG4gICAgICAgIGlmIChsYXN0Tm9uRXhwb3J0U3RhdGVtZW50SW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgYm9keS5zbGljZSgwLCBsYXN0Tm9uRXhwb3J0U3RhdGVtZW50SW5kZXgpLmZvckVhY2goZnVuY3Rpb24gY2hlY2tOb25FeHBvcnQobm9kZSkge1xuICAgICAgICAgICAgaWYgKCFpc05vbkV4cG9ydFN0YXRlbWVudChub2RlKSkge1xuICAgICAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnRXhwb3J0IHN0YXRlbWVudHMgc2hvdWxkIGFwcGVhciBhdCB0aGUgZW5kIG9mIHRoZSBmaWxlJyxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcbn07XG4iXX0=