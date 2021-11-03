"use strict";

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } it = o[Symbol.iterator](); return it.next.bind(it); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var list = require('postcss').list;

module.exports = {
  /**
     * Throw special error, to tell beniary,
     * that this error is from Autoprefixer.
     */
  error: function error(text) {
    var err = new Error(text);
    err.autoprefixer = true;
    throw err;
  },

  /**
     * Return array, that doesn’t contain duplicates.
     */
  uniq: function uniq(array) {
    var filtered = [];

    for (var _iterator = _createForOfIteratorHelperLoose(array), _step; !(_step = _iterator()).done;) {
      var i = _step.value;

      if (!filtered.includes(i)) {
        filtered.push(i);
      }
    }

    return filtered;
  },

  /**
     * Return "-webkit-" on "-webkit- old"
     */
  removeNote: function removeNote(string) {
    if (!string.includes(' ')) {
      return string;
    }

    return string.split(' ')[0];
  },

  /**
     * Escape RegExp symbols
     */
  escapeRegexp: function escapeRegexp(string) {
    return string.replace(/[$()*+-.?[\\\]^{|}]/g, '\\$&');
  },

  /**
     * Return regexp to check, that CSS string contain word
     */
  regexp: function regexp(word, escape) {
    if (escape === void 0) {
      escape = true;
    }

    if (escape) {
      word = this.escapeRegexp(word);
    }

    return new RegExp("(^|[\\s,(])(" + word + "($|[\\s(,]))", 'gi');
  },

  /**
     * Change comma list
     */
  editList: function editList(value, callback) {
    var origin = list.comma(value);
    var changed = callback(origin, []);

    if (origin === changed) {
      return value;
    }

    var join = value.match(/,\s*/);
    join = join ? join[0] : ', ';
    return changed.join(join);
  },

  /**
     * Split the selector into parts.
     * It returns 3 level deep array because selectors can be comma
     * separated (1), space separated (2), and combined (3)
     * @param {String} selector selector string
     * @return {Array<Array<Array>>} 3 level deep array of split selector
     * @see utils.test.js for examples
     */
  splitSelector: function splitSelector(selector) {
    return list.comma(selector).map(function (i) {
      return list.space(i).map(function (k) {
        return k.split(/(?=\.|#)/g);
      });
    });
  }
};