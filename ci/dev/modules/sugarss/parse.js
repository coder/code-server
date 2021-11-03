'use strict';

exports.__esModule = true;
exports.default = parse;

var _input = require('postcss/lib/input');

var _input2 = _interopRequireDefault(_input);

var _preprocess = require('./preprocess');

var _preprocess2 = _interopRequireDefault(_preprocess);

var _tokenize = require('./tokenize');

var _tokenize2 = _interopRequireDefault(_tokenize);

var _parser = require('./parser');

var _parser2 = _interopRequireDefault(_parser);

var _liner = require('./liner');

var _liner2 = _interopRequireDefault(_liner);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parse(source, opts) {
  var input = new _input2.default(source, opts);

  var parser = new _parser2.default(input);
  parser.tokens = (0, _tokenize2.default)(input);
  parser.parts = (0, _preprocess2.default)(input, (0, _liner2.default)(parser.tokens));
  parser.loop();

  return parser.root;
}
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhcnNlLmVzNiJdLCJuYW1lcyI6WyJwYXJzZSIsInNvdXJjZSIsIm9wdHMiLCJpbnB1dCIsIklucHV0IiwicGFyc2VyIiwiUGFyc2VyIiwidG9rZW5zIiwicGFydHMiLCJsb29wIiwicm9vdCJdLCJtYXBwaW5ncyI6Ijs7O2tCQU93QkEsSzs7QUFQeEI7Ozs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRWUsU0FBU0EsS0FBVCxDQUFnQkMsTUFBaEIsRUFBd0JDLElBQXhCLEVBQThCO0FBQzNDLE1BQUlDLFFBQVEsSUFBSUMsZUFBSixDQUFVSCxNQUFWLEVBQWtCQyxJQUFsQixDQUFaOztBQUVBLE1BQUlHLFNBQVMsSUFBSUMsZ0JBQUosQ0FBV0gsS0FBWCxDQUFiO0FBQ0FFLFNBQU9FLE1BQVAsR0FBZ0Isd0JBQVVKLEtBQVYsQ0FBaEI7QUFDQUUsU0FBT0csS0FBUCxHQUFlLDBCQUFXTCxLQUFYLEVBQWtCLHFCQUFNRSxPQUFPRSxNQUFiLENBQWxCLENBQWY7QUFDQUYsU0FBT0ksSUFBUDs7QUFFQSxTQUFPSixPQUFPSyxJQUFkO0FBQ0QiLCJmaWxlIjoicGFyc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgSW5wdXQgZnJvbSAncG9zdGNzcy9saWIvaW5wdXQnXG5cbmltcG9ydCBwcmVwcm9jZXNzIGZyb20gJy4vcHJlcHJvY2VzcydcbmltcG9ydCB0b2tlbml6ZXIgZnJvbSAnLi90b2tlbml6ZSdcbmltcG9ydCBQYXJzZXIgZnJvbSAnLi9wYXJzZXInXG5pbXBvcnQgbGluZXIgZnJvbSAnLi9saW5lcidcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcGFyc2UgKHNvdXJjZSwgb3B0cykge1xuICBsZXQgaW5wdXQgPSBuZXcgSW5wdXQoc291cmNlLCBvcHRzKVxuXG4gIGxldCBwYXJzZXIgPSBuZXcgUGFyc2VyKGlucHV0KVxuICBwYXJzZXIudG9rZW5zID0gdG9rZW5pemVyKGlucHV0KVxuICBwYXJzZXIucGFydHMgPSBwcmVwcm9jZXNzKGlucHV0LCBsaW5lcihwYXJzZXIudG9rZW5zKSlcbiAgcGFyc2VyLmxvb3AoKVxuXG4gIHJldHVybiBwYXJzZXIucm9vdFxufVxuIl19