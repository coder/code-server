"use strict";

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } it = o[Symbol.iterator](); return it.next.bind(it); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _defaults(subClass, superClass); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Declaration = require('../declaration');

var TransformDecl = /*#__PURE__*/function (_Declaration) {
  _inheritsLoose(TransformDecl, _Declaration);

  function TransformDecl() {
    return _Declaration.apply(this, arguments) || this;
  }

  var _proto = TransformDecl.prototype;

  /**
   * Recursively check all parents for @keyframes
   */
  _proto.keyframeParents = function keyframeParents(decl) {
    var parent = decl.parent;

    while (parent) {
      if (parent.type === 'atrule' && parent.name === 'keyframes') {
        return true;
      }

      var _parent = parent;
      parent = _parent.parent;
    }

    return false;
  }
  /**
   * Is transform contain 3D commands
   */
  ;

  _proto.contain3d = function contain3d(decl) {
    if (decl.prop === 'transform-origin') {
      return false;
    }

    for (var _iterator = _createForOfIteratorHelperLoose(TransformDecl.functions3d), _step; !(_step = _iterator()).done;) {
      var func = _step.value;

      if (decl.value.includes(func + "(")) {
        return true;
      }
    }

    return false;
  }
  /**
   * Replace rotateZ to rotate for IE 9
   */
  ;

  _proto.set = function set(decl, prefix) {
    decl = _Declaration.prototype.set.call(this, decl, prefix);

    if (prefix === '-ms-') {
      decl.value = decl.value.replace(/rotatez/gi, 'rotate');
    }

    return decl;
  }
  /**
   * Don't add prefix for IE in keyframes
   */
  ;

  _proto.insert = function insert(decl, prefix, prefixes) {
    if (prefix === '-ms-') {
      if (!this.contain3d(decl) && !this.keyframeParents(decl)) {
        return _Declaration.prototype.insert.call(this, decl, prefix, prefixes);
      }
    } else if (prefix === '-o-') {
      if (!this.contain3d(decl)) {
        return _Declaration.prototype.insert.call(this, decl, prefix, prefixes);
      }
    } else {
      return _Declaration.prototype.insert.call(this, decl, prefix, prefixes);
    }

    return undefined;
  };

  return TransformDecl;
}(Declaration);

_defineProperty(TransformDecl, "names", ['transform', 'transform-origin']);

_defineProperty(TransformDecl, "functions3d", ['matrix3d', 'translate3d', 'translateZ', 'scale3d', 'scaleZ', 'rotate3d', 'rotateX', 'rotateY', 'perspective']);

module.exports = TransformDecl;