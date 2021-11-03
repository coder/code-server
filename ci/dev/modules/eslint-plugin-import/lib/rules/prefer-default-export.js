'use strict';

var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('prefer-default-export') },

    schema: [] },


  create: function (context) {
    let specifierExportCount = 0;
    let hasDefaultExport = false;
    let hasStarExport = false;
    let hasTypeExport = false;
    let namedExportNode = null;

    function captureDeclaration(identifierOrPattern) {
      if (identifierOrPattern && identifierOrPattern.type === 'ObjectPattern') {
        // recursively capture
        identifierOrPattern.properties.
        forEach(function (property) {
          captureDeclaration(property.value);
        });
      } else if (identifierOrPattern && identifierOrPattern.type === 'ArrayPattern') {
        identifierOrPattern.elements.
        forEach(captureDeclaration);
      } else {
        // assume it's a single standard identifier
        specifierExportCount++;
      }
    }

    return {
      'ExportDefaultSpecifier': function () {
        hasDefaultExport = true;
      },

      'ExportSpecifier': function (node) {
        if (node.exported.name === 'default') {
          hasDefaultExport = true;
        } else {
          specifierExportCount++;
          namedExportNode = node;
        }
      },

      'ExportNamedDeclaration': function (node) {
        // if there are specifiers, node.declaration should be null
        if (!node.declaration) return;const

        type = node.declaration.type;

        if (
        type === 'TSTypeAliasDeclaration' ||
        type === 'TypeAlias' ||
        type === 'TSInterfaceDeclaration' ||
        type === 'InterfaceDeclaration')
        {
          specifierExportCount++;
          hasTypeExport = true;
          return;
        }

        if (node.declaration.declarations) {
          node.declaration.declarations.forEach(function (declaration) {
            captureDeclaration(declaration.id);
          });
        } else
        {
          // captures 'export function foo() {}' syntax
          specifierExportCount++;
        }

        namedExportNode = node;
      },

      'ExportDefaultDeclaration': function () {
        hasDefaultExport = true;
      },

      'ExportAllDeclaration': function () {
        hasStarExport = true;
      },

      'Program:exit': function () {
        if (specifierExportCount === 1 && !hasDefaultExport && !hasStarExport && !hasTypeExport) {
          context.report(namedExportNode, 'Prefer default export.');
        }
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9wcmVmZXItZGVmYXVsdC1leHBvcnQuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJ0eXBlIiwiZG9jcyIsInVybCIsInNjaGVtYSIsImNyZWF0ZSIsImNvbnRleHQiLCJzcGVjaWZpZXJFeHBvcnRDb3VudCIsImhhc0RlZmF1bHRFeHBvcnQiLCJoYXNTdGFyRXhwb3J0IiwiaGFzVHlwZUV4cG9ydCIsIm5hbWVkRXhwb3J0Tm9kZSIsImNhcHR1cmVEZWNsYXJhdGlvbiIsImlkZW50aWZpZXJPclBhdHRlcm4iLCJwcm9wZXJ0aWVzIiwiZm9yRWFjaCIsInByb3BlcnR5IiwidmFsdWUiLCJlbGVtZW50cyIsIm5vZGUiLCJleHBvcnRlZCIsIm5hbWUiLCJkZWNsYXJhdGlvbiIsImRlY2xhcmF0aW9ucyIsImlkIiwicmVwb3J0Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQSxxQzs7QUFFQUEsT0FBT0MsT0FBUCxHQUFpQjtBQUNmQyxRQUFNO0FBQ0pDLFVBQU0sWUFERjtBQUVKQyxVQUFNO0FBQ0pDLFdBQUssdUJBQVEsdUJBQVIsQ0FERCxFQUZGOztBQUtKQyxZQUFRLEVBTEosRUFEUzs7O0FBU2ZDLFVBQVEsVUFBU0MsT0FBVCxFQUFrQjtBQUN4QixRQUFJQyx1QkFBdUIsQ0FBM0I7QUFDQSxRQUFJQyxtQkFBbUIsS0FBdkI7QUFDQSxRQUFJQyxnQkFBZ0IsS0FBcEI7QUFDQSxRQUFJQyxnQkFBZ0IsS0FBcEI7QUFDQSxRQUFJQyxrQkFBa0IsSUFBdEI7O0FBRUEsYUFBU0Msa0JBQVQsQ0FBNEJDLG1CQUE1QixFQUFpRDtBQUMvQyxVQUFJQSx1QkFBdUJBLG9CQUFvQlosSUFBcEIsS0FBNkIsZUFBeEQsRUFBeUU7QUFDdkU7QUFDQVksNEJBQW9CQyxVQUFwQjtBQUNHQyxlQURILENBQ1csVUFBU0MsUUFBVCxFQUFtQjtBQUMxQkosNkJBQW1CSSxTQUFTQyxLQUE1QjtBQUNELFNBSEg7QUFJRCxPQU5ELE1BTU8sSUFBSUosdUJBQXVCQSxvQkFBb0JaLElBQXBCLEtBQTZCLGNBQXhELEVBQXdFO0FBQzdFWSw0QkFBb0JLLFFBQXBCO0FBQ0dILGVBREgsQ0FDV0gsa0JBRFg7QUFFRCxPQUhNLE1BR0M7QUFDUjtBQUNFTDtBQUNEO0FBQ0Y7O0FBRUQsV0FBTztBQUNMLGdDQUEwQixZQUFXO0FBQ25DQywyQkFBbUIsSUFBbkI7QUFDRCxPQUhJOztBQUtMLHlCQUFtQixVQUFTVyxJQUFULEVBQWU7QUFDaEMsWUFBSUEsS0FBS0MsUUFBTCxDQUFjQyxJQUFkLEtBQXVCLFNBQTNCLEVBQXNDO0FBQ3BDYiw2QkFBbUIsSUFBbkI7QUFDRCxTQUZELE1BRU87QUFDTEQ7QUFDQUksNEJBQWtCUSxJQUFsQjtBQUNEO0FBQ0YsT0FaSTs7QUFjTCxnQ0FBMEIsVUFBU0EsSUFBVCxFQUFlO0FBQ3ZDO0FBQ0EsWUFBSSxDQUFDQSxLQUFLRyxXQUFWLEVBQXVCLE9BRmdCOztBQUkvQnJCLFlBSitCLEdBSXRCa0IsS0FBS0csV0FKaUIsQ0FJL0JyQixJQUorQjs7QUFNdkM7QUFDRUEsaUJBQVMsd0JBQVQ7QUFDQUEsaUJBQVMsV0FEVDtBQUVBQSxpQkFBUyx3QkFGVDtBQUdBQSxpQkFBUyxzQkFKWDtBQUtFO0FBQ0FNO0FBQ0FHLDBCQUFnQixJQUFoQjtBQUNBO0FBQ0Q7O0FBRUQsWUFBSVMsS0FBS0csV0FBTCxDQUFpQkMsWUFBckIsRUFBbUM7QUFDakNKLGVBQUtHLFdBQUwsQ0FBaUJDLFlBQWpCLENBQThCUixPQUE5QixDQUFzQyxVQUFTTyxXQUFULEVBQXNCO0FBQzFEViwrQkFBbUJVLFlBQVlFLEVBQS9CO0FBQ0QsV0FGRDtBQUdELFNBSkQ7QUFLSztBQUNIO0FBQ0FqQjtBQUNEOztBQUVESSwwQkFBa0JRLElBQWxCO0FBQ0QsT0ExQ0k7O0FBNENMLGtDQUE0QixZQUFXO0FBQ3JDWCwyQkFBbUIsSUFBbkI7QUFDRCxPQTlDSTs7QUFnREwsOEJBQXdCLFlBQVc7QUFDakNDLHdCQUFnQixJQUFoQjtBQUNELE9BbERJOztBQW9ETCxzQkFBZ0IsWUFBVztBQUN6QixZQUFJRix5QkFBeUIsQ0FBekIsSUFBOEIsQ0FBQ0MsZ0JBQS9CLElBQW1ELENBQUNDLGFBQXBELElBQXFFLENBQUNDLGFBQTFFLEVBQXlGO0FBQ3ZGSixrQkFBUW1CLE1BQVIsQ0FBZWQsZUFBZixFQUFnQyx3QkFBaEM7QUFDRDtBQUNGLE9BeERJLEVBQVA7O0FBMERELEdBMUZjLEVBQWpCIiwiZmlsZSI6InByZWZlci1kZWZhdWx0LWV4cG9ydC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3N1Z2dlc3Rpb24nLFxuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgncHJlZmVyLWRlZmF1bHQtZXhwb3J0JyksXG4gICAgfSxcbiAgICBzY2hlbWE6IFtdLFxuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24oY29udGV4dCkge1xuICAgIGxldCBzcGVjaWZpZXJFeHBvcnRDb3VudCA9IDA7XG4gICAgbGV0IGhhc0RlZmF1bHRFeHBvcnQgPSBmYWxzZTtcbiAgICBsZXQgaGFzU3RhckV4cG9ydCA9IGZhbHNlO1xuICAgIGxldCBoYXNUeXBlRXhwb3J0ID0gZmFsc2U7XG4gICAgbGV0IG5hbWVkRXhwb3J0Tm9kZSA9IG51bGw7XG5cbiAgICBmdW5jdGlvbiBjYXB0dXJlRGVjbGFyYXRpb24oaWRlbnRpZmllck9yUGF0dGVybikge1xuICAgICAgaWYgKGlkZW50aWZpZXJPclBhdHRlcm4gJiYgaWRlbnRpZmllck9yUGF0dGVybi50eXBlID09PSAnT2JqZWN0UGF0dGVybicpIHtcbiAgICAgICAgLy8gcmVjdXJzaXZlbHkgY2FwdHVyZVxuICAgICAgICBpZGVudGlmaWVyT3JQYXR0ZXJuLnByb3BlcnRpZXNcbiAgICAgICAgICAuZm9yRWFjaChmdW5jdGlvbihwcm9wZXJ0eSkge1xuICAgICAgICAgICAgY2FwdHVyZURlY2xhcmF0aW9uKHByb3BlcnR5LnZhbHVlKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoaWRlbnRpZmllck9yUGF0dGVybiAmJiBpZGVudGlmaWVyT3JQYXR0ZXJuLnR5cGUgPT09ICdBcnJheVBhdHRlcm4nKSB7XG4gICAgICAgIGlkZW50aWZpZXJPclBhdHRlcm4uZWxlbWVudHNcbiAgICAgICAgICAuZm9yRWFjaChjYXB0dXJlRGVjbGFyYXRpb24pO1xuICAgICAgfSBlbHNlICB7XG4gICAgICAvLyBhc3N1bWUgaXQncyBhIHNpbmdsZSBzdGFuZGFyZCBpZGVudGlmaWVyXG4gICAgICAgIHNwZWNpZmllckV4cG9ydENvdW50Kys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICdFeHBvcnREZWZhdWx0U3BlY2lmaWVyJzogZnVuY3Rpb24oKSB7XG4gICAgICAgIGhhc0RlZmF1bHRFeHBvcnQgPSB0cnVlO1xuICAgICAgfSxcblxuICAgICAgJ0V4cG9ydFNwZWNpZmllcic6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUuZXhwb3J0ZWQubmFtZSA9PT0gJ2RlZmF1bHQnKSB7XG4gICAgICAgICAgaGFzRGVmYXVsdEV4cG9ydCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3BlY2lmaWVyRXhwb3J0Q291bnQrKztcbiAgICAgICAgICBuYW1lZEV4cG9ydE5vZGUgPSBub2RlO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbic6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgLy8gaWYgdGhlcmUgYXJlIHNwZWNpZmllcnMsIG5vZGUuZGVjbGFyYXRpb24gc2hvdWxkIGJlIG51bGxcbiAgICAgICAgaWYgKCFub2RlLmRlY2xhcmF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgeyB0eXBlIH0gPSBub2RlLmRlY2xhcmF0aW9uO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICB0eXBlID09PSAnVFNUeXBlQWxpYXNEZWNsYXJhdGlvbicgfHxcbiAgICAgICAgICB0eXBlID09PSAnVHlwZUFsaWFzJyB8fFxuICAgICAgICAgIHR5cGUgPT09ICdUU0ludGVyZmFjZURlY2xhcmF0aW9uJyB8fFxuICAgICAgICAgIHR5cGUgPT09ICdJbnRlcmZhY2VEZWNsYXJhdGlvbidcbiAgICAgICAgKSB7XG4gICAgICAgICAgc3BlY2lmaWVyRXhwb3J0Q291bnQrKztcbiAgICAgICAgICBoYXNUeXBlRXhwb3J0ID0gdHJ1ZTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9kZS5kZWNsYXJhdGlvbi5kZWNsYXJhdGlvbnMpIHtcbiAgICAgICAgICBub2RlLmRlY2xhcmF0aW9uLmRlY2xhcmF0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGRlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICBjYXB0dXJlRGVjbGFyYXRpb24oZGVjbGFyYXRpb24uaWQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIC8vIGNhcHR1cmVzICdleHBvcnQgZnVuY3Rpb24gZm9vKCkge30nIHN5bnRheFxuICAgICAgICAgIHNwZWNpZmllckV4cG9ydENvdW50Kys7XG4gICAgICAgIH1cblxuICAgICAgICBuYW1lZEV4cG9ydE5vZGUgPSBub2RlO1xuICAgICAgfSxcblxuICAgICAgJ0V4cG9ydERlZmF1bHREZWNsYXJhdGlvbic6IGZ1bmN0aW9uKCkge1xuICAgICAgICBoYXNEZWZhdWx0RXhwb3J0ID0gdHJ1ZTtcbiAgICAgIH0sXG5cbiAgICAgICdFeHBvcnRBbGxEZWNsYXJhdGlvbic6IGZ1bmN0aW9uKCkge1xuICAgICAgICBoYXNTdGFyRXhwb3J0ID0gdHJ1ZTtcbiAgICAgIH0sXG5cbiAgICAgICdQcm9ncmFtOmV4aXQnOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHNwZWNpZmllckV4cG9ydENvdW50ID09PSAxICYmICFoYXNEZWZhdWx0RXhwb3J0ICYmICFoYXNTdGFyRXhwb3J0ICYmICFoYXNUeXBlRXhwb3J0KSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQobmFtZWRFeHBvcnROb2RlLCAnUHJlZmVyIGRlZmF1bHQgZXhwb3J0LicpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG59O1xuIl19