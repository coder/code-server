'use strict';var _ExportMap = require('../ExportMap');var _ExportMap2 = _interopRequireDefault(_ExportMap);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: (0, _docsUrl2.default)('default') },

    schema: [] },


  create: function (context) {

    function checkDefault(specifierType, node) {

      const defaultSpecifier = node.specifiers.find(
      specifier => specifier.type === specifierType);


      if (!defaultSpecifier) return;
      const imports = _ExportMap2.default.get(node.source.value, context);
      if (imports == null) return;

      if (imports.errors.length) {
        imports.reportErrors(context, node);
      } else if (imports.get('default') === undefined) {
        context.report({
          node: defaultSpecifier,
          message: `No default export found in imported module "${node.source.value}".` });

      }
    }

    return {
      'ImportDeclaration': checkDefault.bind(null, 'ImportDefaultSpecifier'),
      'ExportNamedDeclaration': checkDefault.bind(null, 'ExportDefaultSpecifier') };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9kZWZhdWx0LmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwidHlwZSIsImRvY3MiLCJ1cmwiLCJzY2hlbWEiLCJjcmVhdGUiLCJjb250ZXh0IiwiY2hlY2tEZWZhdWx0Iiwic3BlY2lmaWVyVHlwZSIsIm5vZGUiLCJkZWZhdWx0U3BlY2lmaWVyIiwic3BlY2lmaWVycyIsImZpbmQiLCJzcGVjaWZpZXIiLCJpbXBvcnRzIiwiRXhwb3J0cyIsImdldCIsInNvdXJjZSIsInZhbHVlIiwiZXJyb3JzIiwibGVuZ3RoIiwicmVwb3J0RXJyb3JzIiwidW5kZWZpbmVkIiwicmVwb3J0IiwibWVzc2FnZSIsImJpbmQiXSwibWFwcGluZ3MiOiJhQUFBLHlDO0FBQ0EscUM7O0FBRUFBLE9BQU9DLE9BQVAsR0FBaUI7QUFDZkMsUUFBTTtBQUNKQyxVQUFNLFNBREY7QUFFSkMsVUFBTTtBQUNKQyxXQUFLLHVCQUFRLFNBQVIsQ0FERCxFQUZGOztBQUtKQyxZQUFRLEVBTEosRUFEUzs7O0FBU2ZDLFVBQVEsVUFBVUMsT0FBVixFQUFtQjs7QUFFekIsYUFBU0MsWUFBVCxDQUFzQkMsYUFBdEIsRUFBcUNDLElBQXJDLEVBQTJDOztBQUV6QyxZQUFNQyxtQkFBbUJELEtBQUtFLFVBQUwsQ0FBZ0JDLElBQWhCO0FBQ3ZCQyxtQkFBYUEsVUFBVVosSUFBVixLQUFtQk8sYUFEVCxDQUF6Qjs7O0FBSUEsVUFBSSxDQUFDRSxnQkFBTCxFQUF1QjtBQUN2QixZQUFNSSxVQUFVQyxvQkFBUUMsR0FBUixDQUFZUCxLQUFLUSxNQUFMLENBQVlDLEtBQXhCLEVBQStCWixPQUEvQixDQUFoQjtBQUNBLFVBQUlRLFdBQVcsSUFBZixFQUFxQjs7QUFFckIsVUFBSUEsUUFBUUssTUFBUixDQUFlQyxNQUFuQixFQUEyQjtBQUN6Qk4sZ0JBQVFPLFlBQVIsQ0FBcUJmLE9BQXJCLEVBQThCRyxJQUE5QjtBQUNELE9BRkQsTUFFTyxJQUFJSyxRQUFRRSxHQUFSLENBQVksU0FBWixNQUEyQk0sU0FBL0IsRUFBMEM7QUFDL0NoQixnQkFBUWlCLE1BQVIsQ0FBZTtBQUNiZCxnQkFBTUMsZ0JBRE87QUFFYmMsbUJBQVUsK0NBQThDZixLQUFLUSxNQUFMLENBQVlDLEtBQU0sSUFGN0QsRUFBZjs7QUFJRDtBQUNGOztBQUVELFdBQU87QUFDTCwyQkFBcUJYLGFBQWFrQixJQUFiLENBQWtCLElBQWxCLEVBQXdCLHdCQUF4QixDQURoQjtBQUVMLGdDQUEwQmxCLGFBQWFrQixJQUFiLENBQWtCLElBQWxCLEVBQXdCLHdCQUF4QixDQUZyQixFQUFQOztBQUlELEdBbkNjLEVBQWpCIiwiZmlsZSI6ImRlZmF1bHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRXhwb3J0cyBmcm9tICcuLi9FeHBvcnRNYXAnO1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3Byb2JsZW0nLFxuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgnZGVmYXVsdCcpLFxuICAgIH0sXG4gICAgc2NoZW1hOiBbXSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIChjb250ZXh0KSB7XG5cbiAgICBmdW5jdGlvbiBjaGVja0RlZmF1bHQoc3BlY2lmaWVyVHlwZSwgbm9kZSkge1xuXG4gICAgICBjb25zdCBkZWZhdWx0U3BlY2lmaWVyID0gbm9kZS5zcGVjaWZpZXJzLmZpbmQoXG4gICAgICAgIHNwZWNpZmllciA9PiBzcGVjaWZpZXIudHlwZSA9PT0gc3BlY2lmaWVyVHlwZVxuICAgICAgKTtcblxuICAgICAgaWYgKCFkZWZhdWx0U3BlY2lmaWVyKSByZXR1cm47XG4gICAgICBjb25zdCBpbXBvcnRzID0gRXhwb3J0cy5nZXQobm9kZS5zb3VyY2UudmFsdWUsIGNvbnRleHQpO1xuICAgICAgaWYgKGltcG9ydHMgPT0gbnVsbCkgcmV0dXJuO1xuXG4gICAgICBpZiAoaW1wb3J0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgIGltcG9ydHMucmVwb3J0RXJyb3JzKGNvbnRleHQsIG5vZGUpO1xuICAgICAgfSBlbHNlIGlmIChpbXBvcnRzLmdldCgnZGVmYXVsdCcpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgIG5vZGU6IGRlZmF1bHRTcGVjaWZpZXIsXG4gICAgICAgICAgbWVzc2FnZTogYE5vIGRlZmF1bHQgZXhwb3J0IGZvdW5kIGluIGltcG9ydGVkIG1vZHVsZSBcIiR7bm9kZS5zb3VyY2UudmFsdWV9XCIuYCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICdJbXBvcnREZWNsYXJhdGlvbic6IGNoZWNrRGVmYXVsdC5iaW5kKG51bGwsICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJyksXG4gICAgICAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbic6IGNoZWNrRGVmYXVsdC5iaW5kKG51bGwsICdFeHBvcnREZWZhdWx0U3BlY2lmaWVyJyksXG4gICAgfTtcbiAgfSxcbn07XG4iXX0=