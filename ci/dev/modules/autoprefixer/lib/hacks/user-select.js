"use strict";

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _defaults(subClass, superClass); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Declaration = require('../declaration');

var UserSelect = /*#__PURE__*/function (_Declaration) {
  _inheritsLoose(UserSelect, _Declaration);

  function UserSelect() {
    return _Declaration.apply(this, arguments) || this;
  }

  var _proto = UserSelect.prototype;

  /**
   * Change prefixed value for IE
   */
  _proto.set = function set(decl, prefix) {
    if (prefix === '-ms-' && decl.value === 'contain') {
      decl.value = 'element';
    }

    return _Declaration.prototype.set.call(this, decl, prefix);
  };

  return UserSelect;
}(Declaration);

_defineProperty(UserSelect, "names", ['user-select']);

module.exports = UserSelect;