'use strict';




var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const EXPORT_MESSAGE = 'Expected "export" or "export default"'; /**
                                                                 * @fileoverview Rule to prefer ES6 to CJS
                                                                 * @author Jamund Ferguson
                                                                 */const IMPORT_MESSAGE = 'Expected "import" instead of "require()"';function normalizeLegacyOptions(options) {
  if (options.indexOf('allow-primitive-modules') >= 0) {
    return { allowPrimitiveModules: true };
  }
  return options[0] || {};
}

function allowPrimitive(node, options) {
  if (!options.allowPrimitiveModules) return false;
  if (node.parent.type !== 'AssignmentExpression') return false;
  return node.parent.right.type !== 'ObjectExpression';
}

function allowRequire(node, options) {
  return options.allowRequire;
}

function allowConditionalRequire(node, options) {
  return options.allowConditionalRequire !== false;
}

function validateScope(scope) {
  return scope.variableScope.type === 'module';
}

// https://github.com/estree/estree/blob/master/es5.md
function isConditional(node) {
  if (
  node.type === 'IfStatement' ||
  node.type === 'TryStatement' ||
  node.type === 'LogicalExpression' ||
  node.type === 'ConditionalExpression')
  return true;
  if (node.parent) return isConditional(node.parent);
  return false;
}

function isLiteralString(node) {
  return node.type === 'Literal' && typeof node.value === 'string' ||
  node.type === 'TemplateLiteral' && node.expressions.length === 0;
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const schemaString = { enum: ['allow-primitive-modules'] };
const schemaObject = {
  type: 'object',
  properties: {
    allowPrimitiveModules: { 'type': 'boolean' },
    allowRequire: { 'type': 'boolean' },
    allowConditionalRequire: { 'type': 'boolean' } },

  additionalProperties: false };


module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-commonjs') },


    schema: {
      anyOf: [
      {
        type: 'array',
        items: [schemaString],
        additionalItems: false },

      {
        type: 'array',
        items: [schemaObject],
        additionalItems: false }] } },





  create: function (context) {
    const options = normalizeLegacyOptions(context.options);

    return {

      'MemberExpression': function (node) {

        // module.exports
        if (node.object.name === 'module' && node.property.name === 'exports') {
          if (allowPrimitive(node, options)) return;
          context.report({ node, message: EXPORT_MESSAGE });
        }

        // exports.
        if (node.object.name === 'exports') {
          const isInScope = context.getScope().
          variables.
          some(variable => variable.name === 'exports');
          if (!isInScope) {
            context.report({ node, message: EXPORT_MESSAGE });
          }
        }

      },
      'CallExpression': function (call) {
        if (!validateScope(context.getScope())) return;

        if (call.callee.type !== 'Identifier') return;
        if (call.callee.name !== 'require') return;

        if (call.arguments.length !== 1) return;
        if (!isLiteralString(call.arguments[0])) return;

        if (allowRequire(call, options)) return;

        if (allowConditionalRequire(call, options) && isConditional(call.parent)) return;

        // keeping it simple: all 1-string-arg `require` calls are reported
        context.report({
          node: call.callee,
          message: IMPORT_MESSAGE });

      } };


  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1jb21tb25qcy5qcyJdLCJuYW1lcyI6WyJFWFBPUlRfTUVTU0FHRSIsIklNUE9SVF9NRVNTQUdFIiwibm9ybWFsaXplTGVnYWN5T3B0aW9ucyIsIm9wdGlvbnMiLCJpbmRleE9mIiwiYWxsb3dQcmltaXRpdmVNb2R1bGVzIiwiYWxsb3dQcmltaXRpdmUiLCJub2RlIiwicGFyZW50IiwidHlwZSIsInJpZ2h0IiwiYWxsb3dSZXF1aXJlIiwiYWxsb3dDb25kaXRpb25hbFJlcXVpcmUiLCJ2YWxpZGF0ZVNjb3BlIiwic2NvcGUiLCJ2YXJpYWJsZVNjb3BlIiwiaXNDb25kaXRpb25hbCIsImlzTGl0ZXJhbFN0cmluZyIsInZhbHVlIiwiZXhwcmVzc2lvbnMiLCJsZW5ndGgiLCJzY2hlbWFTdHJpbmciLCJlbnVtIiwic2NoZW1hT2JqZWN0IiwicHJvcGVydGllcyIsImFkZGl0aW9uYWxQcm9wZXJ0aWVzIiwibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJkb2NzIiwidXJsIiwic2NoZW1hIiwiYW55T2YiLCJpdGVtcyIsImFkZGl0aW9uYWxJdGVtcyIsImNyZWF0ZSIsImNvbnRleHQiLCJvYmplY3QiLCJuYW1lIiwicHJvcGVydHkiLCJyZXBvcnQiLCJtZXNzYWdlIiwiaXNJblNjb3BlIiwiZ2V0U2NvcGUiLCJ2YXJpYWJsZXMiLCJzb21lIiwidmFyaWFibGUiLCJjYWxsIiwiY2FsbGVlIiwiYXJndW1lbnRzIl0sIm1hcHBpbmdzIjoiOzs7OztBQUtBLHFDOztBQUVBLE1BQU1BLGlCQUFpQix1Q0FBdkIsQyxDQVBBOzs7bUVBUUEsTUFBTUMsaUJBQWlCLDBDQUF2QixDQUVBLFNBQVNDLHNCQUFULENBQWdDQyxPQUFoQyxFQUF5QztBQUN2QyxNQUFJQSxRQUFRQyxPQUFSLENBQWdCLHlCQUFoQixLQUE4QyxDQUFsRCxFQUFxRDtBQUNuRCxXQUFPLEVBQUVDLHVCQUF1QixJQUF6QixFQUFQO0FBQ0Q7QUFDRCxTQUFPRixRQUFRLENB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RDtBQUNBLFlBQUlPLEtBQUs4QixNQUFMLENBQVlDLElBQVosS0FBcUIsU0FBekIsRUFBb0M7QUFDbEMsZ0JBQU1JLFlBQVlOLFFBQVFPLFFBQVI7QUFDZkMsbUJBRGU7QUFFZkMsY0FGZSxDQUVWQyxZQUFZQSxTQUFTUixJQUFULEtBQWtCLFNBRnBCLENBQWxCO0FBR0EsY0FBSSxDQUFFSSxTQUFOLEVBQWlCO0FBQ2ZOLG9CQUFRSSxNQUFSLENBQWUsRUFBRWpDLElBQUYsRUFBUWtDLFNBQVN6QyxjQUFqQixFQUFmO0FBQ0Q7QUFDRjs7QUFFRixPQXBCSTtBQXFCTCx3QkFBa0IsVUFBVStDLElBQVYsRUFBZ0I7QUFDaEMsWUFBSSxDQUFDbEMsY0FBY3VCLFFBQVFPLFFBQVIsRUFBZCxDQUFMLEVBQXdDOztBQUV4QyxZQUFJSSxLQUFLQyxNQUFMLENBQVl2QyxJQUFaLEtBQXFCLFlBQXpCLEVBQXVDO0FBQ3ZDLFlBQUlzQyxLQUFLQyxNQUFMLENBQVlWLElBQVosS0FBcUIsU0FBekIsRUFBb0M7O0FBRXBDLFlBQUlTLEtBQUtFLFNBQUwsQ0FBZTdCLE1BQWYsS0FBMEIsQ0FBOUIsRUFBaUM7QUFDakMsWUFBSSxDQUFDSCxnQkFBZ0I4QixLQUFLRSxTQUFMLENBQWUsQ0FBZixDQUFoQixDQUFMLEVBQXlDOztBQUV6QyxZQUFJdEMsYUFBYW9DLElBQWIsRUFBbUI1QyxPQUFuQixDQUFKLEVBQWlDOztBQUVqQyxZQUFJUyx3QkFBd0JtQyxJQUF4QixFQUE4QjVDLE9BQTlCLEtBQTBDYSxjQUFjK0IsS0FBS3ZDLE1BQW5CLENBQTlDLEVBQTBFOztBQUUxRTtBQUNBNEIsZ0JBQVFJLE1BQVIsQ0FBZTtBQUNiakMsZ0JBQU13QyxLQUFLQyxNQURFO0FBRWJQLG1CQUFTeEMsY0FGSSxFQUFmOztBQUlELE9BdkNJLEVBQVA7OztBQTBDRCxHQXBFYyxFQUFqQiIsImZpbGUiOiJuby1jb21tb25qcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVvdmVydmlldyBSdWxlIHRvIHByZWZlciBFUzYgdG8gQ0pTXG4gKiBAYXV0aG9yIEphbXVuZCBGZXJndXNvblxuICovXG5cbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnO1xuXG5jb25zdCBFWFBPUlRfTUVTU0FHRSA9ICdFeHBlY3RlZCBcImV4cG9ydFwiIG9yIFwiZXhwb3J0IGRlZmF1bHRcIic7XG5jb25zdCBJTVBPUlRfTUVTU0FHRSA9ICdFeHBlY3RlZCBcImltcG9ydFwiIGluc3RlYWQgb2YgXCJyZXF1aXJlKClcIic7XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUxlZ2FjeU9wdGlvbnMob3B0aW9ucykge1xuICBpZiAob3B0aW9ucy5pbmRleE9mKCdhbGxvdy1wcmltaXRpdmUtbW9kdWxlcycpID49IDApIHtcbiAgICByZXR1cm4geyBhbGxvd1ByaW1pdGl2ZU1vZHVsZXM6IHRydWUgfTtcbiAgfVxuICByZXR1cm4gb3B0aW9uc1swXSB8fCB7fTtcbn1cblxuZnVuY3Rpb24gYWxsb3dQcmltaXRpdmUobm9kZSwgb3B0aW9ucykge1xuICBpZiAoIW9wdGlvbnMuYWxsb3dQcmltaXRpdmVNb2R1bGVzKSByZXR1cm4gZmFsc2U7XG4gIGlmIChub2RlLnBhcmVudC50eXBlICE9PSAnQXNzaWdubWVudEV4cHJlc3Npb24nKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiAobm9kZS5wYXJlbnQucmlnaHQudHlwZSAhPT0gJ09iamVjdEV4cHJlc3Npb24nKTtcbn1cblxuZnVuY3Rpb24gYWxsb3dSZXF1aXJlKG5vZGUsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIG9wdGlvbnMuYWxsb3dSZXF1aXJlO1xufVxuXG5mdW5jdGlvbiBhbGxvd0NvbmRpdGlvbmFsUmVxdWlyZShub2RlLCBvcHRpb25zKSB7XG4gIHJldHVybiBvcHRpb25zLmFsbG93Q29uZGl0aW9uYWxSZXF1aXJlICE9PSBmYWxzZTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVTY29wZShzY29wZSkge1xuICByZXR1cm4gc2NvcGUudmFyaWFibGVTY29wZS50eXBlID09PSAnbW9kdWxlJztcbn1cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2VzdHJlZS9lc3RyZWUvYmxvYi9tYXN0ZXIvZXM1Lm1kXG5mdW5jdGlvbiBpc0NvbmRpdGlvbmFsKG5vZGUpIHtcbiAgaWYgKFxuICAgIG5vZGUudHlwZSA9PT0gJ0lmU3RhdGVtZW50J1xuICAgIHx8IG5vZGUudHlwZSA9PT0gJ1RyeVN0YXRlbWVudCdcbiAgICB8fCBub2RlLnR5cGUgPT09ICdMb2dpY2FsRXhwcmVzc2lvbidcbiAgICB8fCBub2RlLnR5cGUgPT09ICdDb25kaXRpb25hbEV4cHJlc3Npb24nXG4gICkgcmV0dXJuIHRydWU7XG4gIGlmIChub2RlLnBhcmVudCkgcmV0dXJuIGlzQ29uZGl0aW9uYWwobm9kZS5wYXJlbnQpO1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzTGl0ZXJhbFN0cmluZyhub2RlKSB7XG4gIHJldHVybiAobm9kZS50eXBlID09PSAnTGl0ZXJhbCcgJiYgdHlwZW9mIG5vZGUudmFsdWUgPT09ICdzdHJpbmcnKSB8fFxuICAgIChub2RlLnR5cGUgPT09ICdUZW1wbGF0ZUxpdGVyYWwnICYmIG5vZGUuZXhwcmVzc2lvbnMubGVuZ3RoID09PSAwKTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFJ1bGUgRGVmaW5pdGlvblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY29uc3Qgc2NoZW1hU3RyaW5nID0geyBlbnVtOiBbJ2FsbG93LXByaW1pdGl2ZS1tb2R1bGVzJ10gfTtcbmNvbnN0IHNjaGVtYU9iamVjdCA9IHtcbiAgdHlwZTogJ29iamVjdCcsXG4gIHByb3BlcnRpZXM6IHtcbiAgICBhbGxvd1ByaW1pdGl2ZU1vZHVsZXM6IHsgJ3R5cGUnOiAnYm9vbGVhbicgfSxcbiAgICBhbGxvd1JlcXVpcmU6IHsgJ3R5cGUnOiAnYm9vbGVhbicgfSxcbiAgICBhbGxvd0NvbmRpdGlvbmFsUmVxdWlyZTogeyAndHlwZSc6ICdib29sZWFuJyB9LFxuICB9LFxuICBhZGRpdGlvbmFsUHJvcGVydGllczogZmFsc2UsXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ25vLWNvbW1vbmpzJyksXG4gICAgfSxcblxuICAgIHNjaGVtYToge1xuICAgICAgYW55T2Y6IFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgaXRlbXM6IFtzY2hlbWFTdHJpbmddLFxuICAgICAgICAgIGFkZGl0aW9uYWxJdGVtczogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgIGl0ZW1zOiBbc2NoZW1hT2JqZWN0XSxcbiAgICAgICAgICBhZGRpdGlvbmFsSXRlbXM6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICBjb25zdCBvcHRpb25zID0gbm9ybWFsaXplTGVnYWN5T3B0aW9ucyhjb250ZXh0Lm9wdGlvbnMpO1xuXG4gICAgcmV0dXJuIHtcblxuICAgICAgJ01lbWJlckV4cHJlc3Npb24nOiBmdW5jdGlvbiAobm9kZSkge1xuXG4gICAgICAgIC8vIG1vZHVsZS5leHBvcnRzXG4gICAgICAgIGlmIChub2RlLm9iamVjdC5uYW1lID09PSAnbW9kdWxlJyAmJiBub2RlLnByb3BlcnR5Lm5hbWUgPT09ICdleHBvcnRzJykge1xuICAgICAgICAgIGlmIChhbGxvd1ByaW1pdGl2ZShub2RlLCBvcHRpb25zKSkgcmV0dXJuO1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KHsgbm9kZSwgbWVzc2FnZTogRVhQT1JUX01FU1NBR0UgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBleHBvcnRzLlxuICAgICAgICBpZiAobm9kZS5vYmplY3QubmFtZSA9PT0gJ2V4cG9ydHMnKSB7XG4gICAgICAgICAgY29uc3QgaXNJblNjb3BlID0gY29udGV4dC5nZXRTY29wZSgpXG4gICAgICAgICAgICAudmFyaWFibGVzXG4gICAgICAgICAgICAuc29tZSh2YXJpYWJsZSA9PiB2YXJpYWJsZS5uYW1lID09PSAnZXhwb3J0cycpO1xuICAgICAgICAgIGlmICghIGlzSW5TY29wZSkge1xuICAgICAgICAgICAgY29udGV4dC5yZXBvcnQoeyBub2RlLCBtZXNzYWdlOiBFWFBPUlRfTUVTU0FHRSB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgfSxcbiAgICAgICdDYWxsRXhwcmVzc2lvbic6IGZ1bmN0aW9uIChjYWxsKSB7XG4gICAgICAgIGlmICghdmFsaWRhdGVTY29wZShjb250ZXh0LmdldFNjb3BlKCkpKSByZXR1cm47XG5cbiAgICAgICAgaWYgKGNhbGwuY2FsbGVlLnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuO1xuICAgICAgICBpZiAoY2FsbC5jYWxsZWUubmFtZSAhPT0gJ3JlcXVpcmUnKSByZXR1cm47XG5cbiAgICAgICAgaWYgKGNhbGwuYXJndW1lbnRzLmxlbmd0aCAhPT0gMSkgcmV0dXJuO1xuICAgICAgICBpZiAoIWlzTGl0ZXJhbFN0cmluZyhjYWxsLmFyZ3VtZW50c1swXSkpIHJldHVybjtcblxuICAgICAgICBpZiAoYWxsb3dSZXF1aXJlKGNhbGwsIG9wdGlvbnMpKSByZXR1cm47XG5cbiAgICAgICAgaWYgKGFsbG93Q29uZGl0aW9uYWxSZXF1aXJlKGNhbGwsIG9wdGlvbnMpICYmIGlzQ29uZGl0aW9uYWwoY2FsbC5wYXJlbnQpKSByZXR1cm47XG5cbiAgICAgICAgLy8ga2VlcGluZyBpdCBzaW1wbGU6IGFsbCAxLXN0cmluZy1hcmcgYHJlcXVpcmVgIGNhbGxzIGFyZSByZXBvcnRlZFxuICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgbm9kZTogY2FsbC5jYWxsZWUsXG4gICAgICAgICAgbWVzc2FnZTogSU1QT1JUX01FU1NBR0UsXG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9O1xuXG4gIH0sXG59O1xuIl19