'use strict';var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-default-export') },

    schema: [] },


  create(context) {
    // ignore non-modules
    if (context.parserOptions.sourceType !== 'module') {
      return {};
    }

    const preferNamed = 'Prefer named exports.';
    const noAliasDefault = (_ref) => {let local = _ref.local;return (
        `Do not alias \`${local.name}\` as \`default\`. Just export ` +
        `\`${local.name}\` itself instead.`);};

    return {
      ExportDefaultDeclaration(node) {
        context.report({ node, message: preferNamed });
      },

      ExportNamedDeclaration(node) {
        node.specifiers.forEach(specifier => {
          if (specifier.type === 'ExportDefaultSpecifier' &&
          specifier.exported.name === 'default') {
            context.report({ node, message: preferNamed });
          } else if (specifier.type === 'ExportSpecifier' &&
          specifier.exported.name === 'default') {
            context.report({ node, message: noAliasDefault(specifier) });
          }
        });
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1kZWZhdWx0LWV4cG9ydC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsInR5cGUiLCJkb2NzIiwidXJsIiwic2NoZW1hIiwiY3JlYXRlIiwiY29udGV4dCIsInBhcnNlck9wdGlvbnMiLCJzb3VyY2VUeXBlIiwicHJlZmVyTmFtZWQiLCJub0FsaWFzRGVmYXVsdCIsImxvY2FsIiwibmFtZSIsIkV4cG9ydERlZmF1bHREZWNsYXJhdGlvbiIsIm5vZGUiLCJyZXBvcnQiLCJtZXNzYWdlIiwiRXhwb3J0TmFtZWREZWNsYXJhdGlvbiIsInNwZWNpZmllcnMiLCJmb3JFYWNoIiwic3BlY2lmaWVyIiwiZXhwb3J0ZWQiXSwibWFwcGluZ3MiOiJhQUFBLHFDOztBQUVBQSxPQUFPQyxPQUFQLEdBQWlCO0FBQ2ZDLFFBQU07QUFDSkMsVUFBTSxZQURGO0FBRUpDLFVBQU07QUFDSkMsV0FBSyx1QkFBUSxtQkFBUixDQURELEVBRkY7O0FBS0pDLFlBQVEsRUFMSixFQURTOzs7QUFTZkMsU0FBT0MsT0FBUCxFQUFnQjtBQUNkO0FBQ0EsUUFBSUEsUUFBUUMsYUFBUixDQUFzQkMsVUFBdEIsS0FBcUMsUUFBekMsRUFBbUQ7QUFDakQsYUFBTyxFQUFQO0FBQ0Q7O0FBRUQsVUFBTUMsY0FBYyx1QkFBcEI7QUFDQSxVQUFNQyxpQkFBaUIsZUFBR0MsS0FBSCxRQUFHQSxLQUFIO0FBQ3BCLDBCQUFpQkEsTUFBTUMsSUFBSyxpQ0FBN0I7QUFDQyxhQUFJRCxNQUFNQyxJQUFLLG9CQUZLLEdBQXZCOztBQUlBLFdBQU87QUFDTEMsK0JBQXlCQyxJQUF6QixFQUErQjtBQUM3QlIsZ0JBQVFTLE1BQVIsQ0FBZSxFQUFFRCxJQUFGLEVBQVFFLFNBQVNQLFdBQWpCLEVBQWY7QUFDRCxPQUhJOztBQUtMUSw2QkFBdUJILElBQXZCLEVBQTZCO0FBQzNCQSxhQUFLSSxVQUFMLENBQWdCQyxPQUFoQixDQUF3QkMsYUFBYTtBQUNuQyxjQUFJQSxVQUFVbkIsSUFBVixLQUFtQix3QkFBbkI7QUFDQW1CLG9CQUFVQyxRQUFWLENBQW1CVCxJQUFuQixLQUE0QixTQURoQyxFQUMyQztBQUN6Q04sb0JBQVFTLE1BQVIsQ0FBZSxFQUFFRCxJQUFGLEVBQVFFLFNBQVNQLFdBQWpCLEVBQWY7QUFDRCxXQUhELE1BR08sSUFBSVcsVUFBVW5CLElBQVYsS0FBbUIsaUJBQW5CO0FBQ1BtQixvQkFBVUMsUUFBVixDQUFtQlQsSUFBbkIsS0FBNEIsU0FEekIsRUFDb0M7QUFDekNOLG9CQUFRUyxNQUFSLENBQWUsRUFBRUQsSUFBRixFQUFRRSxTQUFTTixlQUFlVSxTQUFmLENBQWpCLEVBQWY7QUFDRDtBQUNGLFNBUkQ7QUFTRCxPQWZJLEVBQVA7O0FBaUJELEdBckNjLEVBQWpCIiwiZmlsZSI6Im5vLWRlZmF1bHQtZXhwb3J0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3N1Z2dlc3Rpb24nLFxuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgnbm8tZGVmYXVsdC1leHBvcnQnKSxcbiAgICB9LFxuICAgIHNjaGVtYTogW10sXG4gIH0sXG5cbiAgY3JlYXRlKGNvbnRleHQpIHtcbiAgICAvLyBpZ25vcmUgbm9uLW1vZHVsZXNcbiAgICBpZiAoY29udGV4dC5wYXJzZXJPcHRpb25zLnNvdXJjZVR5cGUgIT09ICdtb2R1bGUnKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgY29uc3QgcHJlZmVyTmFtZWQgPSAnUHJlZmVyIG5hbWVkIGV4cG9ydHMuJztcbiAgICBjb25zdCBub0FsaWFzRGVmYXVsdCA9ICh7IGxvY2FsIH0pID0+XG4gICAgICBgRG8gbm90IGFsaWFzIFxcYCR7bG9jYWwubmFtZX1cXGAgYXMgXFxgZGVmYXVsdFxcYC4gSnVzdCBleHBvcnQgYCArXG4gICAgICBgXFxgJHtsb2NhbC5uYW1lfVxcYCBpdHNlbGYgaW5zdGVhZC5gO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIEV4cG9ydERlZmF1bHREZWNsYXJhdGlvbihub2RlKSB7XG4gICAgICAgIGNvbnRleHQucmVwb3J0KHsgbm9kZSwgbWVzc2FnZTogcHJlZmVyTmFtZWQgfSk7XG4gICAgICB9LFxuXG4gICAgICBFeHBvcnROYW1lZERlY2xhcmF0aW9uKG5vZGUpIHtcbiAgICAgICAgbm9kZS5zcGVjaWZpZXJzLmZvckVhY2goc3BlY2lmaWVyID0+IHtcbiAgICAgICAgICBpZiAoc3BlY2lmaWVyLnR5cGUgPT09ICdFeHBvcnREZWZhdWx0U3BlY2lmaWVyJyAmJlxuICAgICAgICAgICAgICBzcGVjaWZpZXIuZXhwb3J0ZWQubmFtZSA9PT0gJ2RlZmF1bHQnKSB7XG4gICAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7IG5vZGUsIG1lc3NhZ2U6IHByZWZlck5hbWVkIH0pO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc3BlY2lmaWVyLnR5cGUgPT09ICdFeHBvcnRTcGVjaWZpZXInICYmXG4gICAgICAgICAgICAgIHNwZWNpZmllci5leHBvcnRlZC5uYW1lID09PSAnZGVmYXVsdCcpIHtcbiAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KHsgbm9kZSwgbWVzc2FnZTogbm9BbGlhc0RlZmF1bHQoc3BlY2lmaWVyKSB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxufTtcbiJdfQ==