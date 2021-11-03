'use strict';var _ExportMap = require('../ExportMap');var _ExportMap2 = _interopRequireDefault(_ExportMap);
var _importDeclaration = require('../importDeclaration');var _importDeclaration2 = _interopRequireDefault(_importDeclaration);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: (0, _docsUrl2.default)('no-named-as-default') },

    schema: [] },


  create: function (context) {
    function checkDefault(nameKey, defaultSpecifier) {
      // #566: default is a valid specifier
      if (defaultSpecifier[nameKey].name === 'default') return;

      const declaration = (0, _importDeclaration2.default)(context);

      const imports = _ExportMap2.default.get(declaration.source.value, context);
      if (imports == null) return;

      if (imports.errors.length) {
        imports.reportErrors(context, declaration);
        return;
      }

      if (imports.has('default') &&
      imports.has(defaultSpecifier[nameKey].name)) {

        context.report(defaultSpecifier,
        'Using exported name \'' + defaultSpecifier[nameKey].name +
        '\' as identifier for default export.');

      }
    }
    return {
      'ImportDefaultSpecifier': checkDefault.bind(null, 'local'),
      'ExportDefaultSpecifier': checkDefault.bind(null, 'exported') };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1uYW1lZC1hcy1kZWZhdWx0LmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwidHlwZSIsImRvY3MiLCJ1cmwiLCJzY2hlbWEiLCJjcmVhdGUiLCJjb250ZXh0IiwiY2hlY2tEZWZhdWx0IiwibmFtZUtleSIsImRlZmF1bHRTcGVjaWZpZXIiLCJuYW1lIiwiZGVjbGFyYXRpb24iLCJpbXBvcnRzIiwiRXhwb3J0cyIsImdldCIsInNvdXJjZSIsInZhbHVlIiwiZXJyb3JzIiwibGVuZ3RoIiwicmVwb3J0RXJyb3JzIiwiaGFzIiwicmVwb3J0IiwiYmluZCJdLCJtYXBwaW5ncyI6ImFBQUEseUM7QUFDQSx5RDtBQUNBLHFDOztBQUVBQSxPQUFPQyxPQUFQLEdBQWlCO0FBQ2ZDLFFBQU07QUFDSkMsVUFBTSxTQURGO0FBRUpDLFVBQU07QUFDSkMsV0FBSyx1QkFBUSxxQkFBUixDQURELEVBRkY7O0FBS0pDLFlBQVEsRUFMSixFQURTOzs7QUFTZkMsVUFBUSxVQUFVQyxPQUFWLEVBQW1CO0FBQ3pCLGFBQVNDLFlBQVQsQ0FBc0JDLE9BQXRCLEVBQStCQyxnQkFBL0IsRUFBaUQ7QUFDL0M7QUFDQSxVQUFJQSxpQkFBaUJELE9BQWpCLEVBQTBCRSxJQUExQixLQUFtQyxTQUF2QyxFQUFrRDs7QUFFbEQsWUFBTUMsY0FBYyxpQ0FBa0JMLE9BQWxCLENBQXBCOztBQUVBLFlBQU1NLFVBQVVDLG9CQUFRQyxHQUFSLENBQVlILFlBQVlJLE1BQVosQ0FBbUJDLEtBQS9CLEVBQXNDVixPQUF0QyxDQUFoQjtBQUNBLFVBQUlNLFdBQVcsSUFBZixFQUFxQjs7QUFFckIsVUFBSUEsUUFBUUssTUFBUixDQUFlQyxNQUFuQixFQUEyQjtBQUN6Qk4sZ0JBQVFPLFlBQVIsQ0FBcUJiLE9BQXJCLEVBQThCSyxXQUE5QjtBQUNBO0FBQ0Q7O0FBRUQsVUFBSUMsUUFBUVEsR0FBUixDQUFZLFNBQVo7QUFDQVIsY0FBUVEsR0FBUixDQUFZWCxpQkFBaUJELE9BQWpCLEVBQTBCRSxJQUF0QyxDQURKLEVBQ2lEOztBQUUvQ0osZ0JBQVFlLE1BQVIsQ0FBZVosZ0JBQWY7QUFDRSxtQ0FBMkJBLGlCQUFpQkQsT0FBakIsRUFBMEJFLElBQXJEO0FBQ0EsOENBRkY7O0FBSUQ7QUFDRjtBQUNELFdBQU87QUFDTCxnQ0FBMEJILGFBQWFlLElBQWIsQ0FBa0IsSUFBbEIsRUFBd0IsT0FBeEIsQ0FEckI7QUFFTCxnQ0FBMEJmLGFBQWFlLElBQWIsQ0FBa0IsSUFBbEIsRUFBd0IsVUFBeEIsQ0FGckIsRUFBUDs7QUFJRCxHQXJDYyxFQUFqQiIsImZpbGUiOiJuby1uYW1lZC1hcy1kZWZhdWx0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEV4cG9ydHMgZnJvbSAnLi4vRXhwb3J0TWFwJztcbmltcG9ydCBpbXBvcnREZWNsYXJhdGlvbiBmcm9tICcuLi9pbXBvcnREZWNsYXJhdGlvbic7XG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICB0eXBlOiAncHJvYmxlbScsXG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCduby1uYW1lZC1hcy1kZWZhdWx0JyksXG4gICAgfSxcbiAgICBzY2hlbWE6IFtdLFxuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICBmdW5jdGlvbiBjaGVja0RlZmF1bHQobmFtZUtleSwgZGVmYXVsdFNwZWNpZmllcikge1xuICAgICAgLy8gIzU2NjogZGVmYXVsdCBpcyBhIHZhbGlkIHNwZWNpZmllclxuICAgICAgaWYgKGRlZmF1bHRTcGVjaWZpZXJbbmFtZUtleV0ubmFtZSA9PT0gJ2RlZmF1bHQnKSByZXR1cm47XG5cbiAgICAgIGNvbnN0IGRlY2xhcmF0aW9uID0gaW1wb3J0RGVjbGFyYXRpb24oY29udGV4dCk7XG5cbiAgICAgIGNvbnN0IGltcG9ydHMgPSBFeHBvcnRzLmdldChkZWNsYXJhdGlvbi5zb3VyY2UudmFsdWUsIGNvbnRleHQpO1xuICAgICAgaWYgKGltcG9ydHMgPT0gbnVsbCkgcmV0dXJuO1xuXG4gICAgICBpZiAoaW1wb3J0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgIGltcG9ydHMucmVwb3J0RXJyb3JzKGNvbnRleHQsIGRlY2xhcmF0aW9uKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoaW1wb3J0cy5oYXMoJ2RlZmF1bHQnKSAmJlxuICAgICAgICAgIGltcG9ydHMuaGFzKGRlZmF1bHRTcGVjaWZpZXJbbmFtZUtleV0ubmFtZSkpIHtcblxuICAgICAgICBjb250ZXh0LnJlcG9ydChkZWZhdWx0U3BlY2lmaWVyLFxuICAgICAgICAgICdVc2luZyBleHBvcnRlZCBuYW1lIFxcJycgKyBkZWZhdWx0U3BlY2lmaWVyW25hbWVLZXldLm5hbWUgK1xuICAgICAgICAgICdcXCcgYXMgaWRlbnRpZmllciBmb3IgZGVmYXVsdCBleHBvcnQuJyk7XG5cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJzogY2hlY2tEZWZhdWx0LmJpbmQobnVsbCwgJ2xvY2FsJyksXG4gICAgICAnRXhwb3J0RGVmYXVsdFNwZWNpZmllcic6IGNoZWNrRGVmYXVsdC5iaW5kKG51bGwsICdleHBvcnRlZCcpLFxuICAgIH07XG4gIH0sXG59O1xuIl19