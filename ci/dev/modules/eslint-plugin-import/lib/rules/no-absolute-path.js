'use strict';var _moduleVisitor = require('eslint-module-utils/moduleVisitor');var _moduleVisitor2 = _interopRequireDefault(_moduleVisitor);
var _importType = require('../core/importType');
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-absolute-path') },

    schema: [(0, _moduleVisitor.makeOptionsSchema)()] },


  create: function (context) {
    function reportIfAbsolute(source) {
      if (typeof source.value === 'string' && (0, _importType.isAbsolute)(source.value)) {
        context.report(source, 'Do not import modules using an absolute path');
      }
    }

    const options = Object.assign({ esmodule: true, commonjs: true }, context.options[0]);
    return (0, _moduleVisitor2.default)(reportIfAbsolute, options);
  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1hYnNvbHV0ZS1wYXRoLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwidHlwZSIsImRvY3MiLCJ1cmwiLCJzY2hlbWEiLCJjcmVhdGUiLCJjb250ZXh0IiwicmVwb3J0SWZBYnNvbHV0ZSIsInNvdXJjZSIsInZhbHVlIiwicmVwb3J0Iiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsImVzbW9kdWxlIiwiY29tbW9uanMiXSwibWFwcGluZ3MiOiJhQUFBLGtFO0FBQ0E7QUFDQSxxQzs7QUFFQUEsT0FBT0MsT0FBUCxHQUFpQjtBQUNmQyxRQUFNO0FBQ0pDLFVBQU0sWUFERjtBQUVKQyxVQUFNO0FBQ0pDLFdBQUssdUJBQVEsa0JBQVIsQ0FERCxFQUZGOztBQUtKQyxZQUFRLENBQUUsdUNBQUYsQ0FMSixFQURTOzs7QUFTZkMsVUFBUSxVQUFVQyxPQUFWLEVBQW1CO0FBQ3pCLGFBQVNDLGdCQUFULENBQTBCQyxNQUExQixFQUFrQztBQUNoQyxVQUFJLE9BQU9BLE9BQU9DLEtBQWQsS0FBd0IsUUFBeEIsSUFBb0MsNEJBQVdELE9BQU9DLEtBQWxCLENBQXhDLEVBQWtFO0FBQ2hFSCxnQkFBUUksTUFBUixDQUFlRixNQUFmLEVBQXVCLDhDQUF2QjtBQUNEO0FBQ0Y7O0FBRUQsVUFBTUcsVUFBVUMsT0FBT0MsTUFBUCxDQUFjLEVBQUVDLFVBQVUsSUFBWixFQUFrQkMsVUFBVSxJQUE1QixFQUFkLEVBQWtEVCxRQUFRSyxPQUFSLENBQWdCLENBQWhCLENBQWxELENBQWhCO0FBQ0EsV0FBTyw2QkFBY0osZ0JBQWQsRUFBZ0NJLE9BQWhDLENBQVA7QUFDRCxHQWxCYyxFQUFqQiIsImZpbGUiOiJuby1hYnNvbHV0ZS1wYXRoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1vZHVsZVZpc2l0b3IsIHsgbWFrZU9wdGlvbnNTY2hlbWEgfSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL21vZHVsZVZpc2l0b3InO1xuaW1wb3J0IHsgaXNBYnNvbHV0ZSB9IGZyb20gJy4uL2NvcmUvaW1wb3J0VHlwZSc7XG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICB0eXBlOiAnc3VnZ2VzdGlvbicsXG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCduby1hYnNvbHV0ZS1wYXRoJyksXG4gICAgfSxcbiAgICBzY2hlbWE6IFsgbWFrZU9wdGlvbnNTY2hlbWEoKSBdLFxuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICBmdW5jdGlvbiByZXBvcnRJZkFic29sdXRlKHNvdXJjZSkge1xuICAgICAgaWYgKHR5cGVvZiBzb3VyY2UudmFsdWUgPT09ICdzdHJpbmcnICYmIGlzQWJzb2x1dGUoc291cmNlLnZhbHVlKSkge1xuICAgICAgICBjb250ZXh0LnJlcG9ydChzb3VyY2UsICdEbyBub3QgaW1wb3J0IG1vZHVsZXMgdXNpbmcgYW4gYWJzb2x1dGUgcGF0aCcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHsgZXNtb2R1bGU6IHRydWUsIGNvbW1vbmpzOiB0cnVlIH0sIGNvbnRleHQub3B0aW9uc1swXSk7XG4gICAgcmV0dXJuIG1vZHVsZVZpc2l0b3IocmVwb3J0SWZBYnNvbHV0ZSwgb3B0aW9ucyk7XG4gIH0sXG59O1xuIl19