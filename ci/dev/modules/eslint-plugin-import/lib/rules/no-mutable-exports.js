'use strict';var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-mutable-exports') },

    schema: [] },


  create: function (context) {
    function checkDeclaration(node) {const
      kind = node.kind;
      if (kind === 'var' || kind === 'let') {
        context.report(node, `Exporting mutable '${kind}' binding, use 'const' instead.`);
      }
    }

    function checkDeclarationsInScope(_ref, name) {let variables = _ref.variables;
      for (const variable of variables) {
        if (variable.name === name) {
          for (const def of variable.defs) {
            if (def.type === 'Variable' && def.parent) {
              checkDeclaration(def.parent);
            }
          }
        }
      }
    }

    function handleExportDefault(node) {
      const scope = context.getScope();

      if (node.declaration.name) {
        checkDeclarationsInScope(scope, node.declaration.name);
      }
    }

    function handleExportNamed(node) {
      const scope = context.getScope();

      if (node.declaration) {
        checkDeclaration(node.declaration);
      } else if (!node.source) {
        for (const specifier of node.specifiers) {
          checkDeclarationsInScope(scope, specifier.local.name);
        }
      }
    }

    return {
      'ExportDefaultDeclaration': handleExportDefault,
      'ExportNamedDeclaration': handleExportNamed };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1tdXRhYmxlLWV4cG9ydHMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJ0eXBlIiwiZG9jcyIsInVybCIsInNjaGVtYSIsImNyZWF0ZSIsImNvbnRleHQiLCJjaGVja0RlY2xhcmF0aW9uIiwibm9kZSIsImtpbmQiLCJyZXBvcnQiLCJjaGVja0RlY2xhcmF0aW9uc0luU2NvcGUiLCJuYW1lIiwidmFyaWFibGVzIiwidmFyaWFibGUiLCJkZWYiLCJkZWZzIiwicGFyZW50IiwiaGFuZGxlRXhwb3J0RGVmYXVsdCIsInNjb3BlIiwiZ2V0U2NvcGUiLCJkZWNsYXJhdGlvbiIsImhhbmRsZUV4cG9ydE5hbWVkIiwic291cmNlIiwic3BlY2lmaWVyIiwic3BlY2lmaWVycyIsImxvY2FsIl0sIm1hcHBpbmdzIjoiYUFBQSxxQzs7QUFFQUEsT0FBT0MsT0FBUCxHQUFpQjtBQUNmQyxRQUFNO0FBQ0pDLFVBQU0sWUFERjtBQUVKQyxVQUFNO0FBQ0pDLFdBQUssdUJBQVEsb0JBQVIsQ0FERCxFQUZGOztBQUtKQyxZQUFRLEVBTEosRUFEUzs7O0FBU2ZDLFVBQVEsVUFBVUMsT0FBVixFQUFtQjtBQUN6QixhQUFTQyxnQkFBVCxDQUEwQkMsSUFBMUIsRUFBZ0M7QUFDdEJDLFVBRHNCLEdBQ2JELElBRGEsQ0FDdEJDLElBRHNCO0FBRTlCLFVBQUlBLFNBQVMsS0FBVCxJQUFrQkEsU0FBUyxLQUEvQixFQUFzQztBQUNwQ0gsZ0JBQVFJLE1BQVIsQ0FBZUYsSUFBZixFQUFzQixzQkFBcUJDLElBQUssaUNBQWhEO0FBQ0Q7QUFDRjs7QUFFRCxhQUFTRSx3QkFBVCxPQUFpREMsSUFBakQsRUFBdUQsS0FBbkJDLFNBQW1CLFFBQW5CQSxTQUFtQjtBQUNyRCxXQUFLLE1BQU1DLFFBQVgsSUFBdUJELFNBQXZCLEVBQWtDO0FBQ2hDLFlBQUlDLFNBQVNGLElBQVQsS0FBa0JBLElBQXRCLEVBQTRCO0FBQzFCLGVBQUssTUFBTUcsR0FBWCxJQUFrQkQsU0FBU0UsSUFBM0IsRUFBaUM7QUFDL0IsZ0JBQUlELElBQUlkLElBQUosS0FBYSxVQUFiLElBQTJCYyxJQUFJRSxNQUFuQyxFQUEyQztBQUN6Q1YsK0JBQWlCUSxJQUFJRSxNQUFyQjtBQUNEO0FBQ0Y7QUFDRjtBQUNGO0FBQ0Y7O0FBRUQsYUFBU0MsbUJBQVQsQ0FBNkJWLElBQTdCLEVBQW1DO0FBQ2pDLFlBQU1XLFFBQVFiLFFBQVFjLFFBQVIsRUFBZDs7QUFFQSxVQUFJWixLQUFLYSxXQUFMLENBQWlCVCxJQUFyQixFQUEyQjtBQUN6QkQsaUNBQXlCUSxLQUF6QixFQUFnQ1gsS0FBS2EsV0FBTCxDQUFpQlQsSUFBakQ7QUFDRDtBQUNGOztBQUVELGFBQVNVLGlCQUFULENBQTJCZCxJQUEzQixFQUFpQztBQUMvQixZQUFNVyxRQUFRYixRQUFRYyxRQUFSLEVBQWQ7O0FBRUEsVUFBSVosS0FBS2EsV0FBVCxFQUF1QjtBQUNyQmQseUJBQWlCQyxLQUFLYSxXQUF0QjtBQUNELE9BRkQsTUFFTyxJQUFJLENBQUNiLEtBQUtlLE1BQVYsRUFBa0I7QUFDdkIsYUFBSyxNQUFNQyxTQUFYLElBQXdCaEIsS0FBS2lCLFVBQTdCLEVBQXlDO0FBQ3ZDZCxtQ0FBeUJRLEtBQXpCLEVBQWdDSyxVQUFVRSxLQUFWLENBQWdCZCxJQUFoRDtBQUNEO0FBQ0Y7QUFDRjs7QUFFRCxXQUFPO0FBQ0wsa0NBQTRCTSxtQkFEdkI7QUFFTCxnQ0FBMEJJLGlCQUZyQixFQUFQOztBQUlELEdBckRjLEVBQWpCIiwiZmlsZSI6Im5vLW11dGFibGUtZXhwb3J0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ25vLW11dGFibGUtZXhwb3J0cycpLFxuICAgIH0sXG4gICAgc2NoZW1hOiBbXSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgZnVuY3Rpb24gY2hlY2tEZWNsYXJhdGlvbihub2RlKSB7XG4gICAgICBjb25zdCB7IGtpbmQgfSA9IG5vZGU7XG4gICAgICBpZiAoa2luZCA9PT0gJ3ZhcicgfHwga2luZCA9PT0gJ2xldCcpIHtcbiAgICAgICAgY29udGV4dC5yZXBvcnQobm9kZSwgYEV4cG9ydGluZyBtdXRhYmxlICcke2tpbmR9JyBiaW5kaW5nLCB1c2UgJ2NvbnN0JyBpbnN0ZWFkLmApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrRGVjbGFyYXRpb25zSW5TY29wZSh7IHZhcmlhYmxlcyB9LCBuYW1lKSB7XG4gICAgICBmb3IgKGNvbnN0IHZhcmlhYmxlIG9mIHZhcmlhYmxlcykge1xuICAgICAgICBpZiAodmFyaWFibGUubmFtZSA9PT0gbmFtZSkge1xuICAgICAgICAgIGZvciAoY29uc3QgZGVmIG9mIHZhcmlhYmxlLmRlZnMpIHtcbiAgICAgICAgICAgIGlmIChkZWYudHlwZSA9PT0gJ1ZhcmlhYmxlJyAmJiBkZWYucGFyZW50KSB7XG4gICAgICAgICAgICAgIGNoZWNrRGVjbGFyYXRpb24oZGVmLnBhcmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlRXhwb3J0RGVmYXVsdChub2RlKSB7XG4gICAgICBjb25zdCBzY29wZSA9IGNvbnRleHQuZ2V0U2NvcGUoKTtcblxuICAgICAgaWYgKG5vZGUuZGVjbGFyYXRpb24ubmFtZSkge1xuICAgICAgICBjaGVja0RlY2xhcmF0aW9uc0luU2NvcGUoc2NvcGUsIG5vZGUuZGVjbGFyYXRpb24ubmFtZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlRXhwb3J0TmFtZWQobm9kZSkge1xuICAgICAgY29uc3Qgc2NvcGUgPSBjb250ZXh0LmdldFNjb3BlKCk7XG5cbiAgICAgIGlmIChub2RlLmRlY2xhcmF0aW9uKSAge1xuICAgICAgICBjaGVja0RlY2xhcmF0aW9uKG5vZGUuZGVjbGFyYXRpb24pO1xuICAgICAgfSBlbHNlIGlmICghbm9kZS5zb3VyY2UpIHtcbiAgICAgICAgZm9yIChjb25zdCBzcGVjaWZpZXIgb2Ygbm9kZS5zcGVjaWZpZXJzKSB7XG4gICAgICAgICAgY2hlY2tEZWNsYXJhdGlvbnNJblNjb3BlKHNjb3BlLCBzcGVjaWZpZXIubG9jYWwubmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgJ0V4cG9ydERlZmF1bHREZWNsYXJhdGlvbic6IGhhbmRsZUV4cG9ydERlZmF1bHQsXG4gICAgICAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbic6IGhhbmRsZUV4cG9ydE5hbWVkLFxuICAgIH07XG4gIH0sXG59O1xuIl19