'use strict';var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function isRequire(node) {
  return node &&
  node.callee &&
  node.callee.type === 'Identifier' &&
  node.callee.name === 'require' &&
  node.arguments.length >= 1;
}

function isStaticValue(arg) {
  return arg.type === 'Literal' ||
  arg.type === 'TemplateLiteral' && arg.expressions.length === 0;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-dynamic-require') },

    schema: [] },


  create: function (context) {
    return {
      CallExpression(node) {
        if (isRequire(node) && !isStaticValue(node.arguments[0])) {
          context.report({
            node,
            message: 'Calls to require() should use string literals' });

        }
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1keW5hbWljLXJlcXVpcmUuanMiXSwibmFtZXMiOlsiaXNSZXF1aXJlIiwibm9kZSIsImNhbGxlZSIsInR5cGUiLCJuYW1lIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwiaXNTdGF0aWNWYWx1ZSIsImFyZyIsImV4cHJlc3Npb25zIiwibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJkb2NzIiwidXJsIiwic2NoZW1hIiwiY3JlYXRlIiwiY29udGV4dCIsIkNhbGxFeHByZXNzaW9uIiwicmVwb3J0IiwibWVzc2FnZSJdLCJtYXBwaW5ncyI6ImFBQUEscUM7O0FBRUEsU0FBU0EsU0FBVCxDQUFtQkMsSUFBbkIsRUFBeUI7QUFDdkIsU0FBT0E7QUFDTEEsT0FBS0MsTUFEQTtBQUVMRCxPQUFLQyxNQUFMLENBQVlDLElBQVosS0FBcUIsWUFGaEI7QUFHTEYsT0FBS0MsTUFBTCxDQUFZRSxJQUFaLEtBQXFCLFNBSGhCO0FBSUxILE9BQUtJLFNBQUwsQ0FBZUMsTUFBZixJQUF5QixDQUozQjtBQUtEOztBQUVELFNBQVNDLGFBQVQsQ0FBdUJDLEdBQXZCLEVBQTRCO0FBQzFCLFNBQU9BLElBQUlMLElBQUosS0FBYSxTQUFiO0FBQ0pLLE1BQUlMLElBQUosS0FBYSxpQkFBYixJQUFrQ0ssSUFBSUMsV0FBSixDQUFnQkgsTUFBaEIsS0FBMkIsQ0FEaEU7QUFFRDs7QUFFREksT0FBT0MsT0FBUCxHQUFpQjtBQUNmQyxRQUFNO0FBQ0pULFVBQU0sWUFERjtBQUVKVSxVQUFNO0FBQ0pDLFdBQUssdUJBQVEsb0JBQVIsQ0FERCxFQUZGOztBQUtKQyxZQUFRLEVBTEosRUFEUzs7O0FBU2ZDLFVBQVEsVUFBVUMsT0FBVixFQUFtQjtBQUN6QixXQUFPO0FBQ0xDLHFCQUFlakIsSUFBZixFQUFxQjtBQUNuQixZQUFJRCxVQUFVQyxJQUFWLEtBQW1CLENBQUNNLGNBQWNOLEtBQUtJLFNBQUwsQ0FBZSxDQUFmLENBQWQsQ0FBeEIsRUFBMEQ7QUFDeERZLGtCQUFRRSxNQUFSLENBQWU7QUFDYmxCLGdCQURhO0FBRWJtQixxQkFBUywrQ0FGSSxFQUFmOztBQUlEO0FBQ0YsT0FSSSxFQUFQOztBQVVELEdBcEJjLEVBQWpCIiwiZmlsZSI6Im5vLWR5bmFtaWMtcmVxdWlyZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnO1xuXG5mdW5jdGlvbiBpc1JlcXVpcmUobm9kZSkge1xuICByZXR1cm4gbm9kZSAmJlxuICAgIG5vZGUuY2FsbGVlICYmXG4gICAgbm9kZS5jYWxsZWUudHlwZSA9PT0gJ0lkZW50aWZpZXInICYmXG4gICAgbm9kZS5jYWxsZWUubmFtZSA9PT0gJ3JlcXVpcmUnICYmXG4gICAgbm9kZS5hcmd1bWVudHMubGVuZ3RoID49IDE7XG59XG5cbmZ1bmN0aW9uIGlzU3RhdGljVmFsdWUoYXJnKSB7XG4gIHJldHVybiBhcmcudHlwZSA9PT0gJ0xpdGVyYWwnIHx8XG4gICAgKGFyZy50eXBlID09PSAnVGVtcGxhdGVMaXRlcmFsJyAmJiBhcmcuZXhwcmVzc2lvbnMubGVuZ3RoID09PSAwKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICB0eXBlOiAnc3VnZ2VzdGlvbicsXG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCduby1keW5hbWljLXJlcXVpcmUnKSxcbiAgICB9LFxuICAgIHNjaGVtYTogW10sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiAoY29udGV4dCkge1xuICAgIHJldHVybiB7XG4gICAgICBDYWxsRXhwcmVzc2lvbihub2RlKSB7XG4gICAgICAgIGlmIChpc1JlcXVpcmUobm9kZSkgJiYgIWlzU3RhdGljVmFsdWUobm9kZS5hcmd1bWVudHNbMF0pKSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdDYWxscyB0byByZXF1aXJlKCkgc2hvdWxkIHVzZSBzdHJpbmcgbGl0ZXJhbHMnLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG59O1xuIl19