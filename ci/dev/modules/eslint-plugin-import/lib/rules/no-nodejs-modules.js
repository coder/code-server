'use strict';var _importType = require('../core/importType');var _importType2 = _interopRequireDefault(_importType);
var _moduleVisitor = require('eslint-module-utils/moduleVisitor');var _moduleVisitor2 = _interopRequireDefault(_moduleVisitor);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function reportIfMissing(context, node, allowed, name) {
  if (allowed.indexOf(name) === -1 && (0, _importType2.default)(name, context) === 'builtin') {
    context.report(node, 'Do not import Node.js builtin module "' + name + '"');
  }
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-nodejs-modules') },

    schema: [
    {
      type: 'object',
      properties: {
        allow: {
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string' } } },



      additionalProperties: false }] },




  create: function (context) {
    const options = context.options[0] || {};
    const allowed = options.allow || [];

    return (0, _moduleVisitor2.default)((source, node) => {
      reportIfMissing(context, node, allowed, source.value);
    }, { commonjs: true });
  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1ub2RlanMtbW9kdWxlcy5qcyJdLCJuYW1lcyI6WyJyZXBvcnRJZk1pc3NpbmciLCJjb250ZXh0Iiwibm9kZSIsImFsbG93ZWQiLCJuYW1lIiwiaW5kZXhPZiIsInJlcG9ydCIsIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwidHlwZSIsImRvY3MiLCJ1cmwiLCJzY2hlbWEiLCJwcm9wZXJ0aWVzIiwiYWxsb3ciLCJ1bmlxdWVJdGVtcyIsIml0ZW1zIiwiYWRkaXRpb25hbFByb3BlcnRpZXMiLCJjcmVhdGUiLCJvcHRpb25zIiwic291cmNlIiwidmFsdWUiLCJjb21tb25qcyJdLCJtYXBwaW5ncyI6ImFBQUEsZ0Q7QUFDQSxrRTtBQUNBLHFDOztBQUVBLFNBQVNBLGVBQVQsQ0FBeUJDLE9BQXpCLEVBQWtDQyxJQUFsQyxFQUF3Q0MsT0FBeEMsRUFBaURDLElBQWpELEVBQXVEO0FBQ3JELE1BQUlELFFBQVFFLE9BQVIsQ0FBZ0JELElBQWhCLE1BQTBCLENBQUMsQ0FBM0IsSUFBZ0MsMEJBQVdBLElBQVgsRUFBaUJILE9BQWpCLE1BQThCLFNBQWxFLEVBQTZFO0FBQzNFQSxZQUFRSyxNQUFSLENBQWVKLElBQWYsRUFBcUIsMkNBQTJDRSxJQUEzQyxHQUFrRCxHQUF2RTtBQUNEO0FBQ0Y7O0FBRURHLE9BQU9DLE9BQVAsR0FBaUI7QUFDZkMsUUFBTTtBQUNKQyxVQUFNLFlBREY7QUFFSkMsVUFBTTtBQUNKQyxXQUFLLHVCQUFRLG1CQUFSLENBREQsRUFGRjs7QUFLSkMsWUFBUTtBQUNOO0FBQ0VILFlBQU0sUUFEUjtBQUVFSSxrQkFBWTtBQUNWQyxlQUFPO0FBQ0xMLGdCQUFNLE9BREQ7QUFFTE0sdUJBQWEsSUFGUjtBQUdMQyxpQkFBTztBQUNMUCxrQkFBTSxRQURELEVBSEYsRUFERyxFQUZkOzs7O0FBV0VRLDRCQUFzQixLQVh4QixFQURNLENBTEosRUFEUzs7Ozs7QUF1QmZDLFVBQVEsVUFBVWxCLE9BQVYsRUFBbUI7QUFDekIsVUFBTW1CLFVBQVVuQixRQUFRbUIsT0FBUixDQUFnQixDQUFoQixLQUFzQixFQUF0QztBQUNBLFVBQU1qQixVQUFVaUIsUUFBUUwsS0FBUixJQUFpQixFQUFqQzs7QUFFQSxXQUFPLDZCQUFjLENBQUNNLE1BQUQsRUFBU25CLElBQVQsS0FBa0I7QUFDckNGLHNCQUFnQkMsT0FBaEIsRUFBeUJDLElBQXpCLEVBQStCQyxPQUEvQixFQUF3Q2tCLE9BQU9DLEtBQS9DO0FBQ0QsS0FGTSxFQUVKLEVBQUVDLFVBQVUsSUFBWixFQUZJLENBQVA7QUFHRCxHQTlCYyxFQUFqQiIsImZpbGUiOiJuby1ub2RlanMtbW9kdWxlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBpbXBvcnRUeXBlIGZyb20gJy4uL2NvcmUvaW1wb3J0VHlwZSc7XG5pbXBvcnQgbW9kdWxlVmlzaXRvciBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL21vZHVsZVZpc2l0b3InO1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5cbmZ1bmN0aW9uIHJlcG9ydElmTWlzc2luZyhjb250ZXh0LCBub2RlLCBhbGxvd2VkLCBuYW1lKSB7XG4gIGlmIChhbGxvd2VkLmluZGV4T2YobmFtZSkgPT09IC0xICYmIGltcG9ydFR5cGUobmFtZSwgY29udGV4dCkgPT09ICdidWlsdGluJykge1xuICAgIGNvbnRleHQucmVwb3J0KG5vZGUsICdEbyBub3QgaW1wb3J0IE5vZGUuanMgYnVpbHRpbiBtb2R1bGUgXCInICsgbmFtZSArICdcIicpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3N1Z2dlc3Rpb24nLFxuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgnbm8tbm9kZWpzLW1vZHVsZXMnKSxcbiAgICB9LFxuICAgIHNjaGVtYTogW1xuICAgICAge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFsbG93OiB7XG4gICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgdW5pcXVlSXRlbXM6IHRydWUsXG4gICAgICAgICAgICBpdGVtczoge1xuICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYWRkaXRpb25hbFByb3BlcnRpZXM6IGZhbHNlLFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICBjb25zdCBvcHRpb25zID0gY29udGV4dC5vcHRpb25zWzBdIHx8IHt9O1xuICAgIGNvbnN0IGFsbG93ZWQgPSBvcHRpb25zLmFsbG93IHx8IFtdO1xuXG4gICAgcmV0dXJuIG1vZHVsZVZpc2l0b3IoKHNvdXJjZSwgbm9kZSkgPT4ge1xuICAgICAgcmVwb3J0SWZNaXNzaW5nKGNvbnRleHQsIG5vZGUsIGFsbG93ZWQsIHNvdXJjZS52YWx1ZSk7XG4gICAgfSwgeyBjb21tb25qczogdHJ1ZSB9KTtcbiAgfSxcbn07XG4iXX0=