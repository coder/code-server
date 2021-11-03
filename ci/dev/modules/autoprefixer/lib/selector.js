"use strict";

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } it = o[Symbol.iterator](); return it.next.bind(it); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _defaults(subClass, superClass); }

var _require = require('postcss'),
    list = _require.list;

var OldSelector = require('./old-selector');

var Prefixer = require('./prefixer');

var Browsers = require('./browsers');

var utils = require('./utils');

var Selector = /*#__PURE__*/function (_Prefixer) {
  _inheritsLoose(Selector, _Prefixer);

  function Selector(name, prefixes, all) {
    var _this;

    _this = _Prefixer.call(this, name, prefixes, all) || this;
    _this.regexpCache = {};
    return _this;
  }
  /**
     * Is rule selectors need to be prefixed
     */


  var _proto = Selector.prototype;

  _proto.check = function check(rule) {
    if (rule.selector.includes(this.name)) {
      return !!rule.selector.match(this.regexp());
    }

    return false;
  }
  /**
     * Return prefixed version of selector
     */
  ;

  _proto.prefixed = function prefixed(prefix) {
    return this.name.replace(/^(\W*)/, "$1" + prefix);
  }
  /**
     * Lazy loadRegExp for name
     */
  ;

  _proto.regexp = function regexp(prefix) {
    if (this.regexpCache[prefix]) {
      return this.regexpCache[prefix];
    }

    var name = prefix ? this.prefixed(prefix) : this.name;
    this.regexpCache[prefix] = new RegExp("(^|[^:\"'=])" + utils.escapeRegexp(name), 'gi');
    return this.regexpCache[prefix];
  }
  /**
     * All possible prefixes
     */
  ;

  _proto.possible = function possible() {
    return Browsers.prefixes();
  }
  /**
     * Return all possible selector prefixes
     */
  ;

  _proto.prefixeds = function prefixeds(rule) {
    var _this2 = this;

    if (rule._autoprefixerPrefixeds) {
      if (rule._autoprefixerPrefixeds[this.name]) {
        return rule._autoprefixerPrefixeds;
      }
    } else {
      rule._autoprefixerPrefixeds = {};
    }

    var prefixeds = {};

    if (rule.selector.includes(',')) {
      var ruleParts = list.comma(rule.selector);
      var toProcess = ruleParts.filter(function (el) {
        return el.includes(_this2.name);
      });

      var _loop = function _loop() {
        var prefix = _step.value;
        prefixeds[prefix] = toProcess.map(function (el) {
          return _this2.replace(el, prefix);
        }).join(', ');
      };

      for (var _iterator = _createForOfIteratorHelperLoose(this.possible()), _step; !(_step = _iterator()).done;) {
        _loop();
      }
    } else {
      for (var _iterator2 = _createForOfIteratorHelperLoose(this.possible()), _step2; !(_step2 = _iterator2()).done;) {
        var prefix = _step2.value;
        prefixeds[prefix] = this.replace(rule.selector, prefix);
      }
    }

    rule._autoprefixerPrefixeds[this.name] = prefixeds;
    return rule._autoprefixerPrefixeds;
  }
  /**
     * Is rule already prefixed before
     */
  ;

  _proto.already = function already(rule, prefixeds, prefix) {
    var index = rule.parent.index(rule) - 1;

    while (index >= 0) {
      var before = rule.parent.nodes[index];

      if (before.type !== 'rule') {
        return false;
      }

      var some = false;

      for (var key in prefixeds[this.name]) {
        var prefixed = prefixeds[this.name][key];

        if (before.selector === prefixed) {
          if (prefix === key) {
            return true;
          } else {
            some = true;
            break;
          }
        }
      }

      if (!some) {
        return false;
      }

      index -= 1;
    }

    return false;
  }
  /**
     * Replace selectors by prefixed one
     */
  ;

  _proto.replace = function replace(selector, prefix) {
    return selector.replace(this.regexp(), "$1" + this.prefixed(prefix));
  }
  /**
     * Clone and add prefixes for at-rule
     */
  ;

  _proto.add = function add(rule, prefix) {
    var prefixeds = this.prefixeds(rule);

    if (this.already(rule, prefixeds, prefix)) {
      return;
    }

    var cloned = this.clone(rule, {
      selector: prefixeds[this.name][prefix]
    });
    rule.parent.insertBefore(rule, cloned);
  }
  /**
     * Return function to fast find prefixed selector
     */
  ;

  _proto.old = function old(prefix) {
    return new OldSelector(this, prefix);
  };

  return Selector;
}(Prefixer);

module.exports = Selector;