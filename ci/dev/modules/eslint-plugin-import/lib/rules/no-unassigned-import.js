'use strict';var _path = require('path');var _path2 = _interopRequireDefault(_path);
var _minimatch = require('minimatch');var _minimatch2 = _interopRequireDefault(_minimatch);

var _staticRequire = require('../core/staticRequire');var _staticRequire2 = _interopRequireDefault(_staticRequire);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function report(context, node) {
  context.report({
    node,
    message: 'Imported module should be assigned' });

}

function testIsAllow(globs, filename, source) {
  if (!Array.isArray(globs)) {
    return false; // default doesn't allow any patterns
  }

  let filePath;

  if (source[0] !== '.' && source[0] !== '/') {// a node module
    filePath = source;
  } else {
    filePath = _path2.default.resolve(_path2.default.dirname(filename), source); // get source absolute path
  }

  return globs.find(glob =>
  (0, _minimatch2.default)(filePath, glob) ||
  (0, _minimatch2.default)(filePath, _path2.default.join(process.cwd(), glob))) !==
  undefined;
}

function create(context) {
  const options = context.options[0] || {};
  const filename = context.getFilename();
  const isAllow = source => testIsAllow(options.allow, filename, source);

  return {
    ImportDeclaration(node) {
      if (node.specifiers.length === 0 && !isAllow(node.source.value)) {
        report(context, node);
      }
    },
    ExpressionStatement(node) {
      if (node.expression.type === 'CallExpression' &&
      (0, _staticRequire2.default)(node.expression) &&
      !isAllow(node.expression.arguments[0].value)) {
        report(context, node.expression);
      }
    } };

}

module.exports = {
  create,
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-unassigned-import') },

    schema: [
    {
      'type': 'object',
      'properties': {
        'devDependencies': { 'type': ['boolean', 'array'] },
        'optionalDependencies': { 'type': ['boolean', 'array'] },
        'peerDependencies': { 'type': ['boolean', 'array'] },
        'allow': {
          'type': 'array',
          'items': {
            'type': 'string' } } },



      'additionalProperties': false }] } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby11bmFzc2lnbmVkLWltcG9ydC5qcyJdLCJuYW1lcyI6WyJyZXBvcnQiLCJjb250ZXh0Iiwibm9kZSIsIm1lc3NhZ2UiLCJ0ZXN0SXNBbGxvdyIsImdsb2JzIiwiZmlsZW5hbWUiLCJzb3VyY2UiLCJBcnJheSIsImlzQXJyYXkiLCJmaWxlUGF0aCIsInBhdGgiLCJyZXNvbHZlIiwiZGlybmFtZSIsImZpbmQiLCJnbG9iIiwiam9pbiIsInByb2Nlc3MiLCJjd2QiLCJ1bmRlZmluZWQiLCJjcmVhdGUiLCJvcHRpb25zIiwiZ2V0RmlsZW5hbWUiLCJpc0FsbG93IiwiYWxsb3ciLCJJbXBvcnREZWNsYXJhdGlvbiIsInNwZWNpZmllcnMiLCJsZW5ndGgiLCJ2YWx1ZSIsIkV4cHJlc3Npb25TdGF0ZW1lbnQiLCJleHByZXNzaW9uIiwidHlwZSIsImFyZ3VtZW50cyIsIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwiZG9jcyIsInVybCIsInNjaGVtYSJdLCJtYXBwaW5ncyI6ImFBQUEsNEI7QUFDQSxzQzs7QUFFQSxzRDtBQUNBLHFDOztBQUVBLFNBQVNBLE1BQVQsQ0FBZ0JDLE9BQWhCLEVBQXlCQyxJQUF6QixFQUErQjtBQUM3QkQsVUFBUUQsTUFBUixDQUFlO0FBQ2JFLFFBRGE7QUFFYkMsYUFBUyxvQ0FGSSxFQUFmOztBQUlEOztBQUVELFNBQVNDLFdBQVQsQ0FBcUJDLEtBQXJCLEVBQTRCQyxRQUE1QixFQUFzQ0MsTUFBdEMsRUFBOEM7QUFDNUMsTUFBSSxDQUFDQyxNQUFNQyxPQUFOLENBQWNKLEtBQWQsQ0FBTCxFQUEyQjtBQUN6QixXQUFPLEtBQVAsQ0FEeUIsQ0FDWDtBQUNmOztBQUVELE1BQUlLLFFBQUo7O0FBRUEsTUFBSUgsT0FBTyxDQUFQLE1BQWMsR0FBZCxJQUFxQkEsT0FBTyxDQUFQLE1BQWMsR0FBdkMsRUFBNEMsQ0FBRTtBQUM1Q0csZUFBV0gsTUFBWDtBQUNELEdBRkQsTUFFTztBQUNMRyxlQUFXQyxlQUFLQyxPQUFMLENBQWFELGVBQUtFLE9BQUwsQ0FBYVAsUUFBYixDQUFiLEVBQXFDQyxNQUFyQyxDQUFYLENBREssQ0FDb0Q7QUFDMUQ7O0FBRUQsU0FBT0YsTUFBTVMsSUFBTixDQUFXQztBQUNoQiwyQkFBVUwsUUFBVixFQUFvQkssSUFBcEI7QUFDQSwyQkFBVUwsUUFBVixFQUFvQkMsZUFBS0ssSUFBTCxDQUFVQyxRQUFRQyxHQUFSLEVBQVYsRUFBeUJILElBQXpCLENBQXBCLENBRks7QUFHQUksV0FIUDtBQUlEOztBQUVELFNBQVNDLE1BQVQsQ0FBZ0JuQixPQUFoQixFQUF5QjtBQUN2QixRQUFNb0IsVUFBVXBCLFFBQVFvQixPQUFSLENBQWdCLENBQWhCLEtBQXNCLEVBQXRDO0FBQ0EsUUFBTWYsV0FBV0wsUUFBUXFCLFdBQVIsRUFBakI7QUFDQSxRQUFNQyxVQUFVaEIsVUFBVUgsWUFBWWlCLFFBQVFHLEtBQXBCLEVBQTJCbEIsUUFBM0IsRUFBcUNDLE1BQXJDLENBQTFCOztBQUVBLFNBQU87QUFDTGtCLHNCQUFrQnZCLElBQWxCLEVBQXdCO0FBQ3RCLFVBQUlBLEtBQUt3QixVQUFMLENBQWdCQyxNQUFoQixLQUEyQixDQUEzQixJQUFnQyxDQUFDSixRQUFRckIsS0FBS0ssTUFBTCxDQUFZcUIsS0FBcEIsQ0FBckMsRUFBaUU7QUFDL0Q1QixlQUFPQyxPQUFQLEVBQWdCQyxJQUFoQjtBQUNEO0FBQ0YsS0FMSTtBQU1MMkIsd0JBQW9CM0IsSUFBcEIsRUFBMEI7QUFDeEIsVUFBSUEsS0FBSzRCLFVBQUwsQ0FBZ0JDLElBQWhCLEtBQXlCLGdCQUF6QjtBQUNGLG1DQUFnQjdCLEtBQUs0QixVQUFyQixDQURFO0FBRUYsT0FBQ1AsUUFBUXJCLEtBQUs0QixVQUFMLENBQWdCRSxTQUFoQixDQUEwQixDQUExQixFQUE2QkosS0FBckMsQ0FGSCxFQUVnRDtBQUM5QzVCLGVBQU9DLE9BQVAsRUFBZ0JDLEtBQUs0QixVQUFyQjtBQUNEO0FBQ0YsS0FaSSxFQUFQOztBQWNEOztBQUVERyxPQUFPQyxPQUFQLEdBQWlCO0FBQ2ZkLFFBRGU7QUFFZmUsUUFBTTtBQUNKSixVQUFNLFlBREY7QUFFSkssVUFBTTtBQUNKQyxXQUFLLHVCQUFRLHNCQUFSLENBREQsRUFGRjs7QUFLSkMsWUFBUTtBQUNOO0FBQ0UsY0FBUSxRQURWO0FBRUUsb0JBQWM7QUFDWiwyQkFBbUIsRUFBRSxRQUFRLENBQUMsU0FBRCxFQUFZLE9BQVosQ0FBVixFQURQO0FBRVosZ0NBQXdCLEVBQUUsUUFBUSxDQUFDLFNBQUQsRUFBWSxPQUFaLENBQVYsRUFGWjtBQUdaLDRCQUFvQixFQUFFLFFBQVEsQ0FBQyxTQUFELEVBQVksT0FBWixDQUFWLEVBSFI7QUFJWixpQkFBUztBQUNQLGtCQUFRLE9BREQ7QUFFUCxtQkFBUztBQUNQLG9CQUFRLFFBREQsRUFGRixFQUpHLEVBRmhCOzs7O0FBYUUsOEJBQXdCLEtBYjFCLEVBRE0sQ0FMSixFQUZTLEVBQWpCIiwiZmlsZSI6Im5vLXVuYXNzaWduZWQtaW1wb3J0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgbWluaW1hdGNoIGZyb20gJ21pbmltYXRjaCc7XG5cbmltcG9ydCBpc1N0YXRpY1JlcXVpcmUgZnJvbSAnLi4vY29yZS9zdGF0aWNSZXF1aXJlJztcbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnO1xuXG5mdW5jdGlvbiByZXBvcnQoY29udGV4dCwgbm9kZSkge1xuICBjb250ZXh0LnJlcG9ydCh7XG4gICAgbm9kZSxcbiAgICBtZXNzYWdlOiAnSW1wb3J0ZWQgbW9kdWxlIHNob3VsZCBiZSBhc3NpZ25lZCcsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiB0ZXN0SXNBbGxvdyhnbG9icywgZmlsZW5hbWUsIHNvdXJjZSkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoZ2xvYnMpKSB7XG4gICAgcmV0dXJuIGZhbHNlOyAvLyBkZWZhdWx0IGRvZXNuJ3QgYWxsb3cgYW55IHBhdHRlcm5zXG4gIH1cblxuICBsZXQgZmlsZVBhdGg7XG5cbiAgaWYgKHNvdXJjZVswXSAhPT0gJy4nICYmIHNvdXJjZVswXSAhPT0gJy8nKSB7IC8vIGEgbm9kZSBtb2R1bGVcbiAgICBmaWxlUGF0aCA9IHNvdXJjZTtcbiAgfSBlbHNlIHtcbiAgICBmaWxlUGF0aCA9IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUoZmlsZW5hbWUpLCBzb3VyY2UpOyAvLyBnZXQgc291cmNlIGFic29sdXRlIHBhdGhcbiAgfVxuXG4gIHJldHVybiBnbG9icy5maW5kKGdsb2IgPT4gKFxuICAgIG1pbmltYXRjaChmaWxlUGF0aCwgZ2xvYikgfHxcbiAgICBtaW5pbWF0Y2goZmlsZVBhdGgsIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBnbG9iKSlcbiAgKSkgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlKGNvbnRleHQpIHtcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbnRleHQub3B0aW9uc1swXSB8fCB7fTtcbiAgY29uc3QgZmlsZW5hbWUgPSBjb250ZXh0LmdldEZpbGVuYW1lKCk7XG4gIGNvbnN0IGlzQWxsb3cgPSBzb3VyY2UgPT4gdGVzdElzQWxsb3cob3B0aW9ucy5hbGxvdywgZmlsZW5hbWUsIHNvdXJjZSk7XG5cbiAgcmV0dXJuIHtcbiAgICBJbXBvcnREZWNsYXJhdGlvbihub2RlKSB7XG4gICAgICBpZiAobm9kZS5zcGVjaWZpZXJzLmxlbmd0aCA9PT0gMCAmJiAhaXNBbGxvdyhub2RlLnNvdXJjZS52YWx1ZSkpIHtcbiAgICAgICAgcmVwb3J0KGNvbnRleHQsIG5vZGUpO1xuICAgICAgfVxuICAgIH0sXG4gICAgRXhwcmVzc2lvblN0YXRlbWVudChub2RlKSB7XG4gICAgICBpZiAobm9kZS5leHByZXNzaW9uLnR5cGUgPT09ICdDYWxsRXhwcmVzc2lvbicgJiZcbiAgICAgICAgaXNTdGF0aWNSZXF1aXJlKG5vZGUuZXhwcmVzc2lvbikgJiZcbiAgICAgICAgIWlzQWxsb3cobm9kZS5leHByZXNzaW9uLmFyZ3VtZW50c1swXS52YWx1ZSkpIHtcbiAgICAgICAgcmVwb3J0KGNvbnRleHQsIG5vZGUuZXhwcmVzc2lvbik7XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNyZWF0ZSxcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ25vLXVuYXNzaWduZWQtaW1wb3J0JyksXG4gICAgfSxcbiAgICBzY2hlbWE6IFtcbiAgICAgIHtcbiAgICAgICAgJ3R5cGUnOiAnb2JqZWN0JyxcbiAgICAgICAgJ3Byb3BlcnRpZXMnOiB7XG4gICAgICAgICAgJ2RldkRlcGVuZGVuY2llcyc6IHsgJ3R5cGUnOiBbJ2Jvb2xlYW4nLCAnYXJyYXknXSB9LFxuICAgICAgICAgICdvcHRpb25hbERlcGVuZGVuY2llcyc6IHsgJ3R5cGUnOiBbJ2Jvb2xlYW4nLCAnYXJyYXknXSB9LFxuICAgICAgICAgICdwZWVyRGVwZW5kZW5jaWVzJzogeyAndHlwZSc6IFsnYm9vbGVhbicsICdhcnJheSddIH0sXG4gICAgICAgICAgJ2FsbG93Jzoge1xuICAgICAgICAgICAgJ3R5cGUnOiAnYXJyYXknLFxuICAgICAgICAgICAgJ2l0ZW1zJzoge1xuICAgICAgICAgICAgICAndHlwZSc6ICdzdHJpbmcnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICAnYWRkaXRpb25hbFByb3BlcnRpZXMnOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcbn07XG4iXX0=