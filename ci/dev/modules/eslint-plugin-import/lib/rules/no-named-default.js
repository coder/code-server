'use strict';var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-named-default') },

    schema: [] },


  create: function (context) {
    return {
      'ImportDeclaration': function (node) {
        node.specifiers.forEach(function (im) {
          if (im.importKind === 'type' || im.importKind === 'typeof') {
            return;
          }

          if (im.type === 'ImportSpecifier' && im.imported.name === 'default') {
            context.report({
              node: im.local,
              message: `Use default import syntax to import '${im.local.name}'.` });
          }
        });
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1uYW1lZC1kZWZhdWx0LmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwidHlwZSIsImRvY3MiLCJ1cmwiLCJzY2hlbWEiLCJjcmVhdGUiLCJjb250ZXh0Iiwibm9kZSIsInNwZWNpZmllcnMiLCJmb3JFYWNoIiwiaW0iLCJpbXBvcnRLaW5kIiwiaW1wb3J0ZWQiLCJuYW1lIiwicmVwb3J0IiwibG9jYWwiLCJtZXNzYWdlIl0sIm1hcHBpbmdzIjoiYUFBQSxxQzs7QUFFQUEsT0FBT0MsT0FBUCxHQUFpQjtBQUNmQyxRQUFNO0FBQ0pDLFVBQU0sWUFERjtBQUVKQyxVQUFNO0FBQ0pDLFdBQUssdUJBQVEsa0JBQVIsQ0FERCxFQUZGOztBQUtKQyxZQUFRLEVBTEosRUFEUzs7O0FBU2ZDLFVBQVEsVUFBVUMsT0FBVixFQUFtQjtBQUN6QixXQUFPO0FBQ0wsMkJBQXFCLFVBQVVDLElBQVYsRUFBZ0I7QUFDbkNBLGFBQUtDLFVBQUwsQ0FBZ0JDLE9BQWhCLENBQXdCLFVBQVVDLEVBQVYsRUFBYztBQUNwQyxjQUFJQSxHQUFHQyxVQUFILEtBQWtCLE1BQWxCLElBQTRCRCxHQUFHQyxVQUFILEtBQWtCLFFBQWxELEVBQTREO0FBQzFEO0FBQ0Q7O0FBRUQsY0FBSUQsR0FBR1QsSUFBSCxLQUFZLGlCQUFaLElBQWlDUyxHQUFHRSxRQUFILENBQVlDLElBQVosS0FBcUIsU0FBMUQsRUFBcUU7QUFDbkVQLG9CQUFRUSxNQUFSLENBQWU7QUFDYlAsb0JBQU1HLEdBQUdLLEtBREk7QUFFYkMsdUJBQVUsd0NBQXVDTixHQUFHSyxLQUFILENBQVNGLElBQUssSUFGbEQsRUFBZjtBQUdEO0FBQ0YsU0FWRDtBQVdELE9BYkksRUFBUDs7QUFlRCxHQXpCYyxFQUFqQiIsImZpbGUiOiJuby1uYW1lZC1kZWZhdWx0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3N1Z2dlc3Rpb24nLFxuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgnbm8tbmFtZWQtZGVmYXVsdCcpLFxuICAgIH0sXG4gICAgc2NoZW1hOiBbXSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICdJbXBvcnREZWNsYXJhdGlvbic6IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIG5vZGUuc3BlY2lmaWVycy5mb3JFYWNoKGZ1bmN0aW9uIChpbSkge1xuICAgICAgICAgIGlmIChpbS5pbXBvcnRLaW5kID09PSAndHlwZScgfHwgaW0uaW1wb3J0S2luZCA9PT0gJ3R5cGVvZicpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoaW0udHlwZSA9PT0gJ0ltcG9ydFNwZWNpZmllcicgJiYgaW0uaW1wb3J0ZWQubmFtZSA9PT0gJ2RlZmF1bHQnKSB7XG4gICAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICAgIG5vZGU6IGltLmxvY2FsLFxuICAgICAgICAgICAgICBtZXNzYWdlOiBgVXNlIGRlZmF1bHQgaW1wb3J0IHN5bnRheCB0byBpbXBvcnQgJyR7aW0ubG9jYWwubmFtZX0nLmAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcbn07XG4iXX0=