"use strict";

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } it = o[Symbol.iterator](); return it.next.bind(it); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function last(array) {
  return array[array.length - 1];
}

var brackets = {
  /**
     * Parse string to nodes tree
     */
  parse: function parse(str) {
    var current = [''];
    var stack = [current];

    for (var _iterator = _createForOfIteratorHelperLoose(str), _step; !(_step = _iterator()).done;) {
      var sym = _step.value;

      if (sym === '(') {
        current = [''];
        last(stack).push(current);
        stack.push(current);
        continue;
      }

      if (sym === ')') {
        stack.pop();
        current = last(stack);
        current.push('');
        continue;
      }

      current[current.length - 1] += sym;
    }

    return stack[0];
  },

  /**
     * Generate output string by nodes tree
     */
  stringify: function stringify(ast) {
    var result = '';

    for (var _iterator2 = _createForOfIteratorHelperLoose(ast), _step2; !(_step2 = _iterator2()).done;) {
      var i = _step2.value;

      if (typeof i === 'object') {
        result += "(" + brackets.stringify(i) + ")";
        continue;
      }

      result += i;
    }

    return result;
  }
};
module.exports = brackets;