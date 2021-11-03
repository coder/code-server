"use strict";

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } it = o[Symbol.iterator](); return it.next.bind(it); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var vendor = require('postcss').vendor;

var Browsers = require('./browsers');

var utils = require('./utils');
/**
 * Recursively clone objects
 */


function _clone(obj, parent) {
  var cloned = new obj.constructor();

  for (var _i = 0, _Object$keys = Object.keys(obj || {}); _i < _Object$keys.length; _i++) {
    var i = _Object$keys[_i];
    var value = obj[i];

    if (i === 'parent' && typeof value === 'object') {
      if (parent) {
        cloned[i] = parent;
      }
    } else if (i === 'source' || i === null) {
      cloned[i] = value;
    } else if (Array.isArray(value)) {
      cloned[i] = value.map(function (x) {
        return _clone(x, cloned);
      });
    } else if (i !== '_autoprefixerPrefix' && i !== '_autoprefixerValues') {
      if (typeof value === 'object' && value !== null) {
        value = _clone(value, cloned);
      }

      cloned[i] = value;
    }
  }

  return cloned;
}

var Prefixer = /*#__PURE__*/function () {
  /**
     * Add hack to selected names
     */
  Prefixer.hack = function hack(klass) {
    var _this = this;

    if (!this.hacks) {
      this.hacks = {};
    }

    return klass.names.map(function (name) {
      _this.hacks[name] = klass;
      return _this.hacks[name];
    });
  }
  /**
     * Load hacks for some names
     */
  ;

  Prefixer.load = function load(name, prefixes, all) {
    var Klass = this.hacks && this.hacks[name];

    if (Klass) {
      return new Klass(name, prefixes, all);
    } else {
      return new this(name, prefixes, all);
    }
  }
  /**
     * Clone node and clean autprefixer custom caches
     */
  ;

  Prefixer.clone = function clone(node, overrides) {
    var cloned = _clone(node);

    for (var name in overrides) {
      cloned[name] = overrides[name];
    }

    return cloned;
  };

  function Prefixer(name, prefixes, all) {
    this.prefixes = prefixes;
    this.name = name;
    this.all = all;
  }
  /**
     * Find prefix in node parents
     */


  var _proto = Prefixer.prototype;

  _proto.parentPrefix = function parentPrefix(node) {
    var prefix;

    if (typeof node._autoprefixerPrefix !== 'undefined') {
      prefix = node._autoprefixerPrefix;
    } else if (node.type === 'decl' && node.prop[0] === '-') {
      prefix = vendor.prefix(node.prop);
    } else if (node.type === 'root') {
      prefix = false;
    } else if (node.type === 'rule' && node.selector.includes(':-') && /:(-\w+-)/.test(node.selector)) {
      prefix = node.selector.match(/:(-\w+-)/)[1];
    } else if (node.type === 'atrule' && node.name[0] === '-') {
      prefix = vendor.prefix(node.name);
    } else {
      prefix = this.parentPrefix(node.parent);
    }

    if (!Browsers.prefixes().includes(prefix)) {
      prefix = false;
    }

    node._autoprefixerPrefix = prefix;
    return node._autoprefixerPrefix;
  }
  /**
     * Clone node with prefixes
     */
  ;

  _proto.process = function process(node, result) {
    if (!this.check(node)) {
      return undefined;
    }

    var parent = this.parentPrefix(node);
    var prefixes = this.prefixes.filter(function (prefix) {
      return !parent || parent === utils.removeNote(prefix);
    });
    var added = [];

    for (var _iterator = _createForOfIteratorHelperLoose(prefixes), _step; !(_step = _iterator()).done;) {
      var prefix = _step.value;

      if (this.add(node, prefix, added.concat([prefix]), result)) {
        added.push(prefix);
      }
    }

    return added;
  }
  /**
     * Shortcut for Prefixer.clone
     */
  ;

  _proto.clone = function clone(node, overrides) {
    return Prefixer.clone(node, overrides);
  };

  return Prefixer;
}();

module.exports = Prefixer;