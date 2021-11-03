'use strict';




var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);
var _has = require('has');var _has2 = _interopRequireDefault(_has);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /**
                                                                                                                                                                  * @fileoverview Rule to disallow anonymous default exports.
                                                                                                                                                                  * @author Duncan Beevers
                                                                                                                                                                  */const defs = { ArrayExpression: {
    option: 'allowArray',
    description: 'If `false`, will report default export of an array',
    message: 'Assign array to a variable before exporting as module default' },

  ArrowFunctionExpression: {
    option: 'allowArrowFunction',
    description: 'If `false`, will report default export of an arrow function',
    message: 'Assign arrow function to a variable before exporting as module default' },

  CallExpression: {
    option: 'allowCallExpression',
    description: 'If `false`, will report default export of a function call',
    message: 'Assign call result to a variable before exporting as module default',
    default: true },

  ClassDeclaration: {
    option: 'allowAnonymousClass',
    description: 'If `false`, will report default export of an anonymous class',
    message: 'Unexpected default export of anonymous class',
    forbid: node => !node.declaration.id },

  FunctionDeclaration: {
    option: 'allowAnonymousFunction',
    description: 'If `false`, will report default export of an anonymous function',
    message: 'Unexpected default export of anonymous function',
    forbid: node => !node.declaration.id },

  Literal: {
    option: 'allowLiteral',
    description: 'If `false`, will report default export of a literal',
    message: 'Assign literal to a variable before exporting as module default' },

  ObjectExpression: {
    option: 'allowObject',
    description: 'If `false`, will report default export of an object expression',
    message: 'Assign object to a variable before exporting as module default' },

  TemplateLiteral: {
    option: 'allowLiteral',
    description: 'If `false`, will report default export of a literal',
    message: 'Assign literal to a variable before exporting as module default' } };



const schemaProperties = Object.keys(defs).
map(key => defs[key]).
reduce((acc, def) => {
  acc[def.option] = {
    description: def.description,
    type: 'boolean' };


  return acc;
}, {});

const defaults = Object.keys(defs).
map(key => defs[key]).
reduce((acc, def) => {
  acc[def.option] = (0, _has2.default)(def, 'default') ? def.default : false;
  return acc;
}, {});

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-anonymous-default-export') },


    schema: [
    {
      type: 'object',
      properties: schemaProperties,
      'additionalProperties': false }] },




  create: function (context) {
    const options = Object.assign({}, defaults, context.options[0]);

    return {
      'ExportDefaultDeclaration': node => {
        const def = defs[node.declaration.type];

        // Recognized node type and allowed by configuration,
        //   and has no forbid check, or forbid check return value is truthy
        if (def && !options[def.option] && (!def.forbid || def.forbid(node))) {
          context.report({ node, message: def.message });
        }
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1hbm9ueW1vdXMtZGVmYXVsdC1leHBvcnQuanMiXSwibmFtZXMiOlsiZGVmcyIsIkFycmF5RXhwcmVzc2lvbiIsIm9wdGlvbiIsImRlc2NyaXB0aW9uIiwibWVzc2FnZSIsIkFycm93RnVuY3Rpb25FeHByZXNzaW9uIiwiQ2FsbEV4cHJlc3Npb24iLCJkZWZhdWx0IiwiQ2xhc3NEZWNsYXJhdGlvbiIsImZvcmJpZCIsIm5vZGUiLCJkZWNsYXJhdGlvbiIsImlkIiwiRnVuY3Rpb25EZWNsYXJhdGlvbiIsIkxpdGVyYWwiLCJPYmplY3RFeHByZXNzaW9uIiwiVGVtcGxhdGVMaXRlcmFsIiwic2NoZW1hUHJvcGVydGllcyIsIk9iamVjdCIsImtleXMiLCJtYXAiLCJrZXkiLCJyZWR1Y2UiLCJhY2MiLCJkZWYiLCJ0eXBlIiwiZGVmYXVsdHMiLCJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsImRvY3MiLCJ1cmwiLCJzY2hlbWEiLCJwcm9wZXJ0aWVzIiwiY3JlYXRlIiwiY29udGV4dCIsIm9wdGlvbnMiLCJhc3NpZ24iLCJyZXBvcnQiXSwibWFwcGluZ3MiOiI7Ozs7O0FBS0EscUM7QUFDQSwwQix1SUFOQTs7O29LQVFBLE1BQU1BLE9BQU8sRUFDWEMsaUJBQWlCO0FBQ2ZDLFlBQVEsWUFETztBQUVmQyxpQkFBYSxvREFGRTtBQUdmQyxhQUFTLCtEQUhNLEVBRE47O0FBTVhDLDJCQUF5QjtBQUN2QkgsWUFBUSxvQkFEZTtBQUV2QkMsaUJBQWEsNkRBRlU7QUFHdkJDLGFBQVMsd0VBSGMsRUFOZDs7QUFXWEUsa0JBQWdCO0FBQ2RKLFlBQVEscUJBRE07QUFFZEMsaUJBQWEsMkRBRkM7QUFHZEMsYUFBUyxxRUFISztBQUlkRyxhQUFTLElBSkssRUFYTDs7QUFpQlhDLG9CQUFrQjtBQUNoQk4sWUFBUSxxQkFEUTtBQUVoQkMsaUJBQWEsOERBRkc7QUFHaEJDLGFBQVMsOENBSE87QUFJaEJLLFlBQVNDLElBQUQsSUFBVSxDQUFDQSxLQUFLQyxXQUFMLENBQWlCQyxFQUpwQixFQWpCUDs7QUF1QlhDLHVCQUFxQjtBQUNuQlgsWUFBUSx3QkFEVztBQUVuQkMsaUJBQWEsaUVBRk07QUFHbkJDLGFBQVMsaURBSFU7QUFJbkJLLFlBQVNDLElBQUQsSUFBVSxDQUFDQSxLQUFLQyxXQUFMLENBQWlCQyxFQUpqQixFQXZCVjs7QUE2QlhFLFdBQVM7QUFDUFosWUFBUSxjQUREO0FBRVBDLGlCQUFhLHFEQUZOO0FBR1BDLGFBQVMsaUVBSEYsRUE3QkU7O0FBa0NYVyxvQkFBa0I7QUFDaEJiLFlBQVEsYUFEUTtBQUVoQkMsaUJBQWEsZ0VBRkc7QUFHaEJDLGFBQVMsZ0VBSE8sRUFsQ1A7O0FBdUNYWSxtQkFBaUI7QUFDZmQsWUFBUSxjQURPO0FBRWZDLGlCQUFhLHFEQUZFO0FBR2ZDLGFBQVMsaUVBSE0sRUF2Q04sRUFBYjs7OztBQThDQSxNQUFNYSxtQkFBbUJDLE9BQU9DLElBQVAsQ0FBWW5CLElBQVo7QUFDdEJvQixHQURzQixDQUNqQkMsR0FBRCxJQUFTckIsS0FBS3FCLEdBQUwsQ0FEUztBQUV0QkMsTUFGc0IsQ0FFZixDQUFDQyxHQUFELEVBQU1DLEdBQU4sS0FBYztBQUNwQkQsTUFBSUMsSUFBSXRCLE1BQVIsSUFBa0I7QUFDaEJDLGlCQUFhcUIsSUFBSXJCLFdBREQ7QUFFaEJzQixVQUFNLFNBRlUsRUFBbEI7OztBQUtBLFNBQU9GLEdBQVA7QUFDRCxDQVRzQixFQVNwQixFQVRvQixDQUF6Qjs7QUFXQSxNQUFNRyxXQUFXUixPQUFPQyxJQUFQLENBQVluQixJQUFaO0FBQ2RvQixHQURjLENBQ1RDLEdBQUQsSUFBU3JCLEtBQUtxQixHQUFMLENBREM7QUFFZEMsTUFGYyxDQUVQLENBQUNDLEdBQUQsRUFBTUMsR0FBTixLQUFjO0FBQ3BCRCxNQUFJQyxJQUFJdEIsTUFBUixJQUFrQixtQkFBSXNCLEdBQUosRUFBUyxTQUFULElBQXNCQSxJQUFJakIsT0FBMUIsR0FBb0MsS0FBdEQ7QUFDQSxTQUFPZ0IsR0FBUDtBQUNELENBTGMsRUFLWixFQUxZLENBQWpCOztBQU9BSSxPQUFPQyxPQUFQLEdBQWlCO0FBQ2ZDLFFBQU07QUFDSkosVUFBTSxZQURGO0FBRUpLLFVBQU07QUFDSkMsV0FBSyx1QkFBUSw2QkFBUixDQURELEVBRkY7OztBQU1KQyxZQUFRO0FBQ047QUFDRVAsWUFBTSxRQURSO0FBRUVRLGtCQUFZaEIsZ0JBRmQ7QUFHRSw4QkFBd0IsS0FIMUIsRUFETSxDQU5KLEVBRFM7Ozs7O0FBZ0JmaUIsVUFBUSxVQUFVQyxPQUFWLEVBQW1CO0FBQ3pCLFVBQU1DLFVBQVVsQixPQUFPbUIsTUFBUCxDQUFjLEVBQWQsRUFBa0JYLFFBQWxCLEVBQTRCUyxRQUFRQyxPQUFSLENBQWdCLENBQWhCLENBQTVCLENBQWhCOztBQUVBLFdBQU87QUFDTCxrQ0FBNkIxQixJQUFELElBQVU7QUFDcEMsY0FBTWMsTUFBTXhCLEtBQUtVLEtBQUtDLFdBQUwsQ0FBaUJjLElBQXRCLENBQVo7O0FBRUE7QUFDQTtBQUNBLFlBQUlELE9BQU8sQ0FBQ1ksUUFBUVosSUFBSXRCLE1BQVosQ0FBUixLQUFnQyxDQUFDc0IsSUFBSWYsTUFBTCxJQUFlZSxJQUFJZixNQUFKLENBQVdDLElBQVgsQ0FBL0MsQ0FBSixFQUFzRTtBQUNwRXlCLGtCQUFRRyxNQUFSLENBQWUsRUFBRTVCLElBQUYsRUFBUU4sU0FBU29CLElBQUlwQixPQUFyQixFQUFmO0FBQ0Q7QUFDRixPQVRJLEVBQVA7O0FBV0QsR0E5QmMsRUFBakIiLCJmaWxlIjoibm8tYW5vbnltb3VzLWRlZmF1bHQtZXhwb3J0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFJ1bGUgdG8gZGlzYWxsb3cgYW5vbnltb3VzIGRlZmF1bHQgZXhwb3J0cy5cbiAqIEBhdXRob3IgRHVuY2FuIEJlZXZlcnNcbiAqL1xuXG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJztcbmltcG9ydCBoYXMgZnJvbSAnaGFzJztcblxuY29uc3QgZGVmcyA9IHtcbiAgQXJyYXlFeHByZXNzaW9uOiB7XG4gICAgb3B0aW9uOiAnYWxsb3dBcnJheScsXG4gICAgZGVzY3JpcHRpb246ICdJZiBgZmFsc2VgLCB3aWxsIHJlcG9ydCBkZWZhdWx0IGV4cG9ydCBvZiBhbiBhcnJheScsXG4gICAgbWVzc2FnZTogJ0Fzc2lnbiBhcnJheSB0byBhIHZhcmlhYmxlIGJlZm9yZSBleHBvcnRpbmcgYXMgbW9kdWxlIGRlZmF1bHQnLFxuICB9LFxuICBBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbjoge1xuICAgIG9wdGlvbjogJ2FsbG93QXJyb3dGdW5jdGlvbicsXG4gICAgZGVzY3JpcHRpb246ICdJZiBgZmFsc2VgLCB3aWxsIHJlcG9ydCBkZWZhdWx0IGV4cG9ydCBvZiBhbiBhcnJvdyBmdW5jdGlvbicsXG4gICAgbWVzc2FnZTogJ0Fzc2lnbiBhcnJvdyBmdW5jdGlvbiB0byBhIHZhcmlhYmxlIGJlZm9yZSBleHBvcnRpbmcgYXMgbW9kdWxlIGRlZmF1bHQnLFxuICB9LFxuICBDYWxsRXhwcmVzc2lvbjoge1xuICAgIG9wdGlvbjogJ2FsbG93Q2FsbEV4cHJlc3Npb24nLFxuICAgIGRlc2NyaXB0aW9uOiAnSWYgYGZhbHNlYCwgd2lsbCByZXBvcnQgZGVmYXVsdCBleHBvcnQgb2YgYSBmdW5jdGlvbiBjYWxsJyxcbiAgICBtZXNzYWdlOiAnQXNzaWduIGNhbGwgcmVzdWx0IHRvIGEgdmFyaWFibGUgYmVmb3JlIGV4cG9ydGluZyBhcyBtb2R1bGUgZGVmYXVsdCcsXG4gICAgZGVmYXVsdDogdHJ1ZSxcbiAgfSxcbiAgQ2xhc3NEZWNsYXJhdGlvbjoge1xuICAgIG9wdGlvbjogJ2FsbG93QW5vbnltb3VzQ2xhc3MnLFxuICAgIGRlc2NyaXB0aW9uOiAnSWYgYGZhbHNlYCwgd2lsbCByZXBvcnQgZGVmYXVsdCBleHBvcnQgb2YgYW4gYW5vbnltb3VzIGNsYXNzJyxcbiAgICBtZXNzYWdlOiAnVW5leHBlY3RlZCBkZWZhdWx0IGV4cG9ydCBvZiBhbm9ueW1vdXMgY2xhc3MnLFxuICAgIGZvcmJpZDogKG5vZGUpID0+ICFub2RlLmRlY2xhcmF0aW9uLmlkLFxuICB9LFxuICBGdW5jdGlvbkRlY2xhcmF0aW9uOiB7XG4gICAgb3B0aW9uOiAnYWxsb3dBbm9ueW1vdXNGdW5jdGlvbicsXG4gICAgZGVzY3JpcHRpb246ICdJZiBgZmFsc2VgLCB3aWxsIHJlcG9ydCBkZWZhdWx0IGV4cG9ydCBvZiBhbiBhbm9ueW1vdXMgZnVuY3Rpb24nLFxuICAgIG1lc3NhZ2U6ICdVbmV4cGVjdGVkIGRlZmF1bHQgZXhwb3J0IG9mIGFub255bW91cyBmdW5jdGlvbicsXG4gICAgZm9yYmlkOiAobm9kZSkgPT4gIW5vZGUuZGVjbGFyYXRpb24uaWQsXG4gIH0sXG4gIExpdGVyYWw6IHtcbiAgICBvcHRpb246ICdhbGxvd0xpdGVyYWwnLFxuICAgIGRlc2NyaXB0aW9uOiAnSWYgYGZhbHNlYCwgd2lsbCByZXBvcnQgZGVmYXVsdCBleHBvcnQgb2YgYSBsaXRlcmFsJyxcbiAgICBtZXNzYWdlOiAnQXNzaWduIGxpdGVyYWwgdG8gYSB2YXJpYWJsZSBiZWZvcmUgZXhwb3J0aW5nIGFzIG1vZHVsZSBkZWZhdWx0JyxcbiAgfSxcbiAgT2JqZWN0RXhwcmVzc2lvbjoge1xuICAgIG9wdGlvbjogJ2FsbG93T2JqZWN0JyxcbiAgICBkZXNjcmlwdGlvbjogJ0lmIGBmYWxzZWAsIHdpbGwgcmVwb3J0IGRlZmF1bHQgZXhwb3J0IG9mIGFuIG9iamVjdCBleHByZXNzaW9uJyxcbiAgICBtZXNzYWdlOiAnQXNzaWduIG9iamVjdCB0byBhIHZhcmlhYmxlIGJlZm9yZSBleHBvcnRpbmcgYXMgbW9kdWxlIGRlZmF1bHQnLFxuICB9LFxuICBUZW1wbGF0ZUxpdGVyYWw6IHtcbiAgICBvcHRpb246ICdhbGxvd0xpdGVyYWwnLFxuICAgIGRlc2NyaXB0aW9uOiAnSWYgYGZhbHNlYCwgd2lsbCByZXBvcnQgZGVmYXVsdCBleHBvcnQgb2YgYSBsaXRlcmFsJyxcbiAgICBtZXNzYWdlOiAnQXNzaWduIGxpdGVyYWwgdG8gYSB2YXJpYWJsZSBiZWZvcmUgZXhwb3J0aW5nIGFzIG1vZHVsZSBkZWZhdWx0JyxcbiAgfSxcbn07XG5cbmNvbnN0IHNjaGVtYVByb3BlcnRpZXMgPSBPYmplY3Qua2V5cyhkZWZzKVxuICAubWFwKChrZXkpID0+IGRlZnNba2V5XSlcbiAgLnJlZHVjZSgoYWNjLCBkZWYpID0+IHtcbiAgICBhY2NbZGVmLm9wdGlvbl0gPSB7XG4gICAgICBkZXNjcmlwdGlvbjogZGVmLmRlc2NyaXB0aW9uLFxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIH07XG5cbiAgICByZXR1cm4gYWNjO1xuICB9LCB7fSk7XG5cbmNvbnN0IGRlZmF1bHRzID0gT2JqZWN0LmtleXMoZGVmcylcbiAgLm1hcCgoa2V5KSA9PiBkZWZzW2tleV0pXG4gIC5yZWR1Y2UoKGFjYywgZGVmKSA9PiB7XG4gICAgYWNjW2RlZi5vcHRpb25dID0gaGFzKGRlZiwgJ2RlZmF1bHQnKSA/IGRlZi5kZWZhdWx0IDogZmFsc2U7XG4gICAgcmV0dXJuIGFjYztcbiAgfSwge30pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ25vLWFub255bW91cy1kZWZhdWx0LWV4cG9ydCcpLFxuICAgIH0sXG5cbiAgICBzY2hlbWE6IFtcbiAgICAgIHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHNjaGVtYVByb3BlcnRpZXMsXG4gICAgICAgICdhZGRpdGlvbmFsUHJvcGVydGllcyc6IGZhbHNlLFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdHMsIGNvbnRleHQub3B0aW9uc1swXSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgJ0V4cG9ydERlZmF1bHREZWNsYXJhdGlvbic6IChub2RlKSA9PiB7XG4gICAgICAgIGNvbnN0IGRlZiA9IGRlZnNbbm9kZS5kZWNsYXJhdGlvbi50eXBlXTtcblxuICAgICAgICAvLyBSZWNvZ25pemVkIG5vZGUgdHlwZSBhbmQgYWxsb3dlZCBieSBjb25maWd1cmF0aW9uLFxuICAgICAgICAvLyAgIGFuZCBoYXMgbm8gZm9yYmlkIGNoZWNrLCBvciBmb3JiaWQgY2hlY2sgcmV0dXJuIHZhbHVlIGlzIHRydXRoeVxuICAgICAgICBpZiAoZGVmICYmICFvcHRpb25zW2RlZi5vcHRpb25dICYmICghZGVmLmZvcmJpZCB8fCBkZWYuZm9yYmlkKG5vZGUpKSkge1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KHsgbm9kZSwgbWVzc2FnZTogZGVmLm1lc3NhZ2UgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcbn07XG4iXX0=