'use strict';var _moduleVisitor = require('eslint-module-utils/moduleVisitor');var _moduleVisitor2 = _interopRequireDefault(_moduleVisitor);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function reportIfNonStandard(context, node, name) {
  if (name && name.indexOf('!') !== -1) {
    context.report(node, `Unexpected '!' in '${name}'. ` +
    'Do not use import syntax to configure webpack loaders.');

  }
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: (0, _docsUrl2.default)('no-webpack-loader-syntax') },

    schema: [] },


  create: function (context) {
    return (0, _moduleVisitor2.default)((source, node) => {
      reportIfNonStandard(context, node, source.value);
    }, { commonjs: true });
  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby13ZWJwYWNrLWxvYWRlci1zeW50YXguanMiXSwibmFtZXMiOlsicmVwb3J0SWZOb25TdGFuZGFyZCIsImNvbnRleHQiLCJub2RlIiwibmFtZSIsImluZGV4T2YiLCJyZXBvcnQiLCJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsInR5cGUiLCJkb2NzIiwidXJsIiwic2NoZW1hIiwiY3JlYXRlIiwic291cmNlIiwidmFsdWUiLCJjb21tb25qcyJdLCJtYXBwaW5ncyI6ImFBQUEsa0U7QUFDQSxxQzs7QUFFQSxTQUFTQSxtQkFBVCxDQUE2QkMsT0FBN0IsRUFBc0NDLElBQXRDLEVBQTRDQyxJQUE1QyxFQUFrRDtBQUNoRCxNQUFJQSxRQUFRQSxLQUFLQyxPQUFMLENBQWEsR0FBYixNQUFzQixDQUFDLENBQW5DLEVBQXNDO0FBQ3BDSCxZQUFRSSxNQUFSLENBQWVILElBQWYsRUFBc0Isc0JBQXFCQyxJQUFLLEtBQTNCO0FBQ25CLDREQURGOztBQUdEO0FBQ0Y7O0FBRURHLE9BQU9DLE9BQVAsR0FBaUI7QUFDZkMsUUFBTTtBQUNKQyxVQUFNLFNBREY7QUFFSkMsVUFBTTtBQUNKQyxXQUFLLHVCQUFRLDBCQUFSLENBREQsRUFGRjs7QUFLSkMsWUFBUSxFQUxKLEVBRFM7OztBQVNmQyxVQUFRLFVBQVVaLE9BQVYsRUFBbUI7QUFDekIsV0FBTyw2QkFBYyxDQUFDYSxNQUFELEVBQVNaLElBQVQsS0FBa0I7QUFDckNGLDBCQUFvQkMsT0FBcEIsRUFBNkJDLElBQTdCLEVBQW1DWSxPQUFPQyxLQUExQztBQUNELEtBRk0sRUFFSixFQUFFQyxVQUFVLElBQVosRUFGSSxDQUFQO0FBR0QsR0FiYyxFQUFqQiIsImZpbGUiOiJuby13ZWJwYWNrLWxvYWRlci1zeW50YXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbW9kdWxlVmlzaXRvciBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL21vZHVsZVZpc2l0b3InO1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5cbmZ1bmN0aW9uIHJlcG9ydElmTm9uU3RhbmRhcmQoY29udGV4dCwgbm9kZSwgbmFtZSkge1xuICBpZiAobmFtZSAmJiBuYW1lLmluZGV4T2YoJyEnKSAhPT0gLTEpIHtcbiAgICBjb250ZXh0LnJlcG9ydChub2RlLCBgVW5leHBlY3RlZCAnIScgaW4gJyR7bmFtZX0nLiBgICtcbiAgICAgICdEbyBub3QgdXNlIGltcG9ydCBzeW50YXggdG8gY29uZmlndXJlIHdlYnBhY2sgbG9hZGVycy4nXG4gICAgKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdwcm9ibGVtJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ25vLXdlYnBhY2stbG9hZGVyLXN5bnRheCcpLFxuICAgIH0sXG4gICAgc2NoZW1hOiBbXSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgcmV0dXJuIG1vZHVsZVZpc2l0b3IoKHNvdXJjZSwgbm9kZSkgPT4ge1xuICAgICAgcmVwb3J0SWZOb25TdGFuZGFyZChjb250ZXh0LCBub2RlLCBzb3VyY2UudmFsdWUpO1xuICAgIH0sIHsgY29tbW9uanM6IHRydWUgfSk7XG4gIH0sXG59O1xuIl19