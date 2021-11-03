"use strict";

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } it = o[Symbol.iterator](); return it.next.bind(it); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _defaults(subClass, superClass); }

var Prefixer = require('./prefixer');

var AtRule = /*#__PURE__*/function (_Prefixer) {
  _inheritsLoose(AtRule, _Prefixer);

  function AtRule() {
    return _Prefixer.apply(this, arguments) || this;
  }

  var _proto = AtRule.prototype;

  /**
     * Clone and add prefixes for at-rule
     */
  _proto.add = function add(rule, prefix) {
    var prefixed = prefix + rule.name;
    var already = rule.parent.some(function (i) {
      return i.name === prefixed && i.params === rule.params;
    });

    if (already) {
      return undefined;
    }

    var cloned = this.clone(rule, {
      name: prefixed
    });
    return rule.parent.insertBefore(rule, cloned);
  }
  /**
     * Clone node with prefixes
     */
  ;

  _proto.process = function process(node) {
    var parent = this.parentPrefix(node);

    for (var _iterator = _createForOfIteratorHelperLoose(this.prefixes), _step; !(_step = _iterator()).done;) {
      var prefix = _step.value;

      if (!parent || parent === prefix) {
        this.add(node, prefix);
      }
    }
  };

  return AtRule;
}(Prefixer);

module.exports = AtRule;