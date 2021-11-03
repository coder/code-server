'use strict';

exports.__esModule = true;
exports.default = liner;
function liner(tokens) {
  var line = [];
  var result = [line];
  var brackets = 0;
  for (var _iterator = tokens, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var token = _ref;

    line.push(token);
    if (token[0] === '(') {
      brackets += 1;
    } else if (token[0] === ')') {
      brackets -= 1;
    } else if (token[0] === 'newline' && brackets === 0) {
      line = [];
      result.push(line);
    }
  }
  return result;
}
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpbmVyLmVzNiJdLCJuYW1lcyI6WyJsaW5lciIsInRva2VucyIsImxpbmUiLCJyZXN1bHQiLCJicmFja2V0cyIsInRva2VuIiwicHVzaCJdLCJtYXBwaW5ncyI6Ijs7O2tCQUF3QkEsSztBQUFULFNBQVNBLEtBQVQsQ0FBZ0JDLE1BQWhCLEVBQXdCO0FBQ3JDLE1BQUlDLE9BQU8sRUFBWDtBQUNBLE1BQUlDLFNBQVMsQ0FBQ0QsSUFBRCxDQUFiO0FBQ0EsTUFBSUUsV0FBVyxDQUFmO0FBQ0EsdUJBQWtCSCxNQUFsQixrSEFBMEI7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBLFFBQWpCSSxLQUFpQjs7QUFDeEJILFNBQUtJLElBQUwsQ0FBVUQsS0FBVjtBQUNBLFFBQUlBLE1BQU0sQ0FBTixNQUFhLEdBQWpCLEVBQXNCO0FBQ3BCRCxrQkFBWSxDQUFaO0FBQ0QsS0FGRCxNQUVPLElBQUlDLE1BQU0sQ0FBTixNQUFhLEdBQWpCLEVBQXNCO0FBQzNCRCxrQkFBWSxDQUFaO0FBQ0QsS0FGTSxNQUVBLElBQUlDLE1BQU0sQ0FBTixNQUFhLFNBQWIsSUFBMEJELGFBQWEsQ0FBM0MsRUFBOEM7QUFDbkRGLGFBQU8sRUFBUDtBQUNBQyxhQUFPRyxJQUFQLENBQVlKLElBQVo7QUFDRDtBQUNGO0FBQ0QsU0FBT0MsTUFBUDtBQUNEIiwiZmlsZSI6ImxpbmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbGluZXIgKHRva2Vucykge1xuICBsZXQgbGluZSA9IFtdXG4gIGxldCByZXN1bHQgPSBbbGluZV1cbiAgbGV0IGJyYWNrZXRzID0gMFxuICBmb3IgKGxldCB0b2tlbiBvZiB0b2tlbnMpIHtcbiAgICBsaW5lLnB1c2godG9rZW4pXG4gICAgaWYgKHRva2VuWzBdID09PSAnKCcpIHtcbiAgICAgIGJyYWNrZXRzICs9IDFcbiAgICB9IGVsc2UgaWYgKHRva2VuWzBdID09PSAnKScpIHtcbiAgICAgIGJyYWNrZXRzIC09IDFcbiAgICB9IGVsc2UgaWYgKHRva2VuWzBdID09PSAnbmV3bGluZScgJiYgYnJhY2tldHMgPT09IDApIHtcbiAgICAgIGxpbmUgPSBbXVxuICAgICAgcmVzdWx0LnB1c2gobGluZSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuIl19