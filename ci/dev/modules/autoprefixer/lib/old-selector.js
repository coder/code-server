"use strict";

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } it = o[Symbol.iterator](); return it.next.bind(it); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var OldSelector = /*#__PURE__*/function () {
  function OldSelector(selector, prefix) {
    this.prefix = prefix;
    this.prefixed = selector.prefixed(this.prefix);
    this.regexp = selector.regexp(this.prefix);
    this.prefixeds = selector.possible().map(function (x) {
      return [selector.prefixed(x), selector.regexp(x)];
    });
    this.unprefixed = selector.name;
    this.nameRegexp = selector.regexp();
  }
  /**
     * Is rule a hack without unprefixed version bottom
     */


  var _proto = OldSelector.prototype;

  _proto.isHack = function isHack(rule) {
    var index = rule.parent.index(rule) + 1;
    var rules = rule.parent.nodes;

    while (index < rules.length) {
      var before = rules[index].selector;

      if (!before) {
        return true;
      }

      if (before.includes(this.unprefixed) && before.match(this.nameRegexp)) {
        return false;
      }

      var some = false;

      for (var _iterator = _createForOfIteratorHelperLoose(this.prefixeds), _step; !(_step = _iterator()).done;) {
        var _step$value = _step.value,
            string = _step$value[0],
            regexp = _step$value[1];

        if (before.includes(string) && before.match(regexp)) {
          some = true;
          break;
        }
      }

      if (!some) {
        return true;
      }

      index += 1;
    }

    return true;
  }
  /**
     * Does rule contain an unnecessary prefixed selector
     */
  ;

  _proto.check = function check(rule) {
    if (!rule.selector.includes(this.prefixed)) {
      return false;
    }

    if (!rule.selector.match(this.regexp)) {
      return false;
    }

    if (this.isHack(rule)) {
      return false;
    }

    return true;
  };

  return OldSelector;
}();

module.exports = OldSelector;