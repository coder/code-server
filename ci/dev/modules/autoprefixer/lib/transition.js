"use strict";

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } it = o[Symbol.iterator](); return it.next.bind(it); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var parser = require('postcss-value-parser');

var vendor = require('postcss').vendor;

var list = require('postcss').list;

var Browsers = require('./browsers');

var Transition = /*#__PURE__*/function () {
  function Transition(prefixes) {
    _defineProperty(this, "props", ['transition', 'transition-property']);

    this.prefixes = prefixes;
  }
  /**
   * Process transition and add prefixes for all necessary properties
   */


  var _proto = Transition.prototype;

  _proto.add = function add(decl, result) {
    var _this = this;

    var prefix, prop;
    var add = this.prefixes.add[decl.prop];
    var vendorPrefixes = this.ruleVendorPrefixes(decl);
    var declPrefixes = vendorPrefixes || add && add.prefixes || [];
    var params = this.parse(decl.value);
    var names = params.map(function (i) {
      return _this.findProp(i);
    });
    var added = [];

    if (names.some(function (i) {
      return i[0] === '-';
    })) {
      return;
    }

    for (var _iterator = _createForOfIteratorHelperLoose(params), _step; !(_step = _iterator()).done;) {
      var param = _step.value;
      prop = this.findProp(param);
      if (prop[0] === '-') continue;
      var prefixer = this.prefixes.add[prop];
      if (!prefixer || !prefixer.prefixes) continue;

      for (var _iterator3 = _createForOfIteratorHelperLoose(prefixer.prefixes), _step3; !(_step3 = _iterator3()).done;) {
        prefix = _step3.value;

        if (vendorPrefixes && !vendorPrefixes.some(function (p) {
          return prefix.includes(p);
        })) {
          continue;
        }

        var prefixed = this.prefixes.prefixed(prop, prefix);

        if (prefixed !== '-ms-transform' && !names.includes(prefixed)) {
          if (!this.disabled(prop, prefix)) {
            added.push(this.clone(prop, prefixed, param));
          }
        }
      }
    }

    params = params.concat(added);
    var value = this.stringify(params);
    var webkitClean = this.stringify(this.cleanFromUnprefixed(params, '-webkit-'));

    if (declPrefixes.includes('-webkit-')) {
      this.cloneBefore(decl, "-webkit-" + decl.prop, webkitClean);
    }

    this.cloneBefore(decl, decl.prop, webkitClean);

    if (declPrefixes.includes('-o-')) {
      var operaClean = this.stringify(this.cleanFromUnprefixed(params, '-o-'));
      this.cloneBefore(decl, "-o-" + decl.prop, operaClean);
    }

    for (var _iterator2 = _createForOfIteratorHelperLoose(declPrefixes), _step2; !(_step2 = _iterator2()).done;) {
      prefix = _step2.value;

      if (prefix !== '-webkit-' && prefix !== '-o-') {
        var prefixValue = this.stringify(this.cleanOtherPrefixes(params, prefix));
        this.cloneBefore(decl, prefix + decl.prop, prefixValue);
      }
    }

    if (value !== decl.value && !this.already(decl, decl.prop, value)) {
      this.checkForWarning(result, decl);
      decl.cloneBefore();
      decl.value = value;
    }
  }
  /**
   * Find property name
   */
  ;

  _proto.findProp = function findProp(param) {
    var prop = param[0].value;

    if (/^\d/.test(prop)) {
      for (var _iterator4 = _createForOfIteratorHelperLoose(param.entries()), _step4; !(_step4 = _iterator4()).done;) {
        var _step4$value = _step4.value,
            i = _step4$value[0],
            token = _step4$value[1];

        if (i !== 0 && token.type === 'word') {
          return token.value;
        }
      }
    }

    return prop;
  }
  /**
   * Does we already have this declaration
   */
  ;

  _proto.already = function already(decl, prop, value) {
    return decl.parent.some(function (i) {
      return i.prop === prop && i.value === value;
    });
  }
  /**
   * Add declaration if it is not exist
   */
  ;

  _proto.cloneBefore = function cloneBefore(decl, prop, value) {
    if (!this.already(decl, prop, value)) {
      decl.cloneBefore({
        prop: prop,
        value: value
      });
    }
  }
  /**
   * Show transition-property warning
   */
  ;

  _proto.checkForWarning = function checkForWarning(result, decl) {
    if (decl.prop !== 'transition-property') {
      return;
    }

    decl.parent.each(function (i) {
      if (i.type !== 'decl') {
        return undefined;
      }

      if (i.prop.indexOf('transition-') !== 0) {
        return undefined;
      }

      if (i.prop === 'transition-property') {
        return undefined;
      }

      if (list.comma(i.value).length > 1) {
        decl.warn(result, 'Replace transition-property to transition, ' + 'because Autoprefixer could not support ' + 'any cases of transition-property ' + 'and other transition-*');
      }

      return false;
    });
  }
  /**
   * Process transition and remove all unnecessary properties
   */
  ;

  _proto.remove = function remove(decl) {
    var _this2 = this;

    var params = this.parse(decl.value);
    params = params.filter(function (i) {
      var prop = _this2.prefixes.remove[_this2.findProp(i)];

      return !prop || !prop.remove;
    });
    var value = this.stringify(params);

    if (decl.value === value) {
      return;
    }

    if (params.length === 0) {
      decl.remove();
      return;
    }

    var _double = decl.parent.some(function (i) {
      return i.prop === decl.prop && i.value === value;
    });

    var smaller = decl.parent.some(function (i) {
      return i !== decl && i.prop === decl.prop && i.value.length > value.length;
    });

    if (_double || smaller) {
      decl.remove();
      return;
    }

    decl.value = value;
  }
  /**
   * Parse properties list to array
   */
  ;

  _proto.parse = function parse(value) {
    var ast = parser(value);
    var result = [];
    var param = [];

    for (var _iterator5 = _createForOfIteratorHelperLoose(ast.nodes), _step5; !(_step5 = _iterator5()).done;) {
      var node = _step5.value;
      param.push(node);

      if (node.type === 'div' && node.value === ',') {
        result.push(param);
        param = [];
      }
    }

    result.push(param);
    return result.filter(function (i) {
      return i.length > 0;
    });
  }
  /**
   * Return properties string from array
   */
  ;

  _proto.stringify = function stringify(params) {
    if (params.length === 0) {
      return '';
    }

    var nodes = [];

    for (var _iterator6 = _createForOfIteratorHelperLoose(params), _step6; !(_step6 = _iterator6()).done;) {
      var param = _step6.value;

      if (param[param.length - 1].type !== 'div') {
        param.push(this.div(params));
      }

      nodes = nodes.concat(param);
    }

    if (nodes[0].type === 'div') {
      nodes = nodes.slice(1);
    }

    if (nodes[nodes.length - 1].type === 'div') {
      nodes = nodes.slice(0, +-2 + 1 || undefined);
    }

    return parser.stringify({
      nodes: nodes
    });
  }
  /**
   * Return new param array with different name
   */
  ;

  _proto.clone = function clone(origin, name, param) {
    var result = [];
    var changed = false;

    for (var _iterator7 = _createForOfIteratorHelperLoose(param), _step7; !(_step7 = _iterator7()).done;) {
      var i = _step7.value;

      if (!changed && i.type === 'word' && i.value === origin) {
        result.push({
          type: 'word',
          value: name
        });
        changed = true;
      } else {
        result.push(i);
      }
    }

    return result;
  }
  /**
   * Find or create separator
   */
  ;

  _proto.div = function div(params) {
    for (var _iterator8 = _createForOfIteratorHelperLoose(params), _step8; !(_step8 = _iterator8()).done;) {
      var param = _step8.value;

      for (var _iterator9 = _createForOfIteratorHelperLoose(param), _step9; !(_step9 = _iterator9()).done;) {
        var node = _step9.value;

        if (node.type === 'div' && node.value === ',') {
          return node;
        }
      }
    }

    return {
      type: 'div',
      value: ',',
      after: ' '
    };
  };

  _proto.cleanOtherPrefixes = function cleanOtherPrefixes(params, prefix) {
    var _this3 = this;

    return params.filter(function (param) {
      var current = vendor.prefix(_this3.findProp(param));
      return current === '' || current === prefix;
    });
  }
  /**
   * Remove all non-webkit prefixes and unprefixed params if we have prefixed
   */
  ;

  _proto.cleanFromUnprefixed = function cleanFromUnprefixed(params, prefix) {
    var _this4 = this;

    var remove = params.map(function (i) {
      return _this4.findProp(i);
    }).filter(function (i) {
      return i.slice(0, prefix.length) === prefix;
    }).map(function (i) {
      return _this4.prefixes.unprefixed(i);
    });
    var result = [];

    for (var _iterator10 = _createForOfIteratorHelperLoose(params), _step10; !(_step10 = _iterator10()).done;) {
      var param = _step10.value;
      var prop = this.findProp(param);
      var p = vendor.prefix(prop);

      if (!remove.includes(prop) && (p === prefix || p === '')) {
        result.push(param);
      }
    }

    return result;
  }
  /**
   * Check property for disabled by option
   */
  ;

  _proto.disabled = function disabled(prop, prefix) {
    var other = ['order', 'justify-content', 'align-self', 'align-content'];

    if (prop.includes('flex') || other.includes(prop)) {
      if (this.prefixes.options.flexbox === false) {
        return true;
      }

      if (this.prefixes.options.flexbox === 'no-2009') {
        return prefix.includes('2009');
      }
    }

    return undefined;
  }
  /**
   * Check if transition prop is inside vendor specific rule
   */
  ;

  _proto.ruleVendorPrefixes = function ruleVendorPrefixes(decl) {
    var parent = decl.parent;

    if (parent.type !== 'rule') {
      return false;
    } else if (!parent.selector.includes(':-')) {
      return false;
    }

    var selectors = Browsers.prefixes().filter(function (s) {
      return parent.selector.includes(':' + s);
    });
    return selectors.length > 0 ? selectors : false;
  };

  return Transition;
}();

module.exports = Transition;