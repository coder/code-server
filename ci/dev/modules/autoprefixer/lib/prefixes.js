"use strict";

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } it = o[Symbol.iterator](); return it.next.bind(it); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var vendor = require('postcss').vendor;

var Declaration = require('./declaration');

var Resolution = require('./resolution');

var Transition = require('./transition');

var Processor = require('./processor');

var Supports = require('./supports');

var Browsers = require('./browsers');

var Selector = require('./selector');

var AtRule = require('./at-rule');

var Value = require('./value');

var utils = require('./utils');

Selector.hack(require('./hacks/fullscreen'));
Selector.hack(require('./hacks/placeholder'));
Selector.hack(require('./hacks/placeholder-shown'));
Declaration.hack(require('./hacks/flex'));
Declaration.hack(require('./hacks/order'));
Declaration.hack(require('./hacks/filter'));
Declaration.hack(require('./hacks/grid-end'));
Declaration.hack(require('./hacks/animation'));
Declaration.hack(require('./hacks/flex-flow'));
Declaration.hack(require('./hacks/flex-grow'));
Declaration.hack(require('./hacks/flex-wrap'));
Declaration.hack(require('./hacks/grid-area'));
Declaration.hack(require('./hacks/place-self'));
Declaration.hack(require('./hacks/grid-start'));
Declaration.hack(require('./hacks/align-self'));
Declaration.hack(require('./hacks/appearance'));
Declaration.hack(require('./hacks/flex-basis'));
Declaration.hack(require('./hacks/mask-border'));
Declaration.hack(require('./hacks/mask-composite'));
Declaration.hack(require('./hacks/align-items'));
Declaration.hack(require('./hacks/user-select'));
Declaration.hack(require('./hacks/flex-shrink'));
Declaration.hack(require('./hacks/break-props'));
Declaration.hack(require('./hacks/color-adjust'));
Declaration.hack(require('./hacks/writing-mode'));
Declaration.hack(require('./hacks/border-image'));
Declaration.hack(require('./hacks/align-content'));
Declaration.hack(require('./hacks/border-radius'));
Declaration.hack(require('./hacks/block-logical'));
Declaration.hack(require('./hacks/grid-template'));
Declaration.hack(require('./hacks/inline-logical'));
Declaration.hack(require('./hacks/grid-row-align'));
Declaration.hack(require('./hacks/transform-decl'));
Declaration.hack(require('./hacks/flex-direction'));
Declaration.hack(require('./hacks/image-rendering'));
Declaration.hack(require('./hacks/backdrop-filter'));
Declaration.hack(require('./hacks/background-clip'));
Declaration.hack(require('./hacks/text-decoration'));
Declaration.hack(require('./hacks/justify-content'));
Declaration.hack(require('./hacks/background-size'));
Declaration.hack(require('./hacks/grid-row-column'));
Declaration.hack(require('./hacks/grid-rows-columns'));
Declaration.hack(require('./hacks/grid-column-align'));
Declaration.hack(require('./hacks/overscroll-behavior'));
Declaration.hack(require('./hacks/grid-template-areas'));
Declaration.hack(require('./hacks/text-emphasis-position'));
Declaration.hack(require('./hacks/text-decoration-skip-ink'));
Value.hack(require('./hacks/gradient'));
Value.hack(require('./hacks/intrinsic'));
Value.hack(require('./hacks/pixelated'));
Value.hack(require('./hacks/image-set'));
Value.hack(require('./hacks/cross-fade'));
Value.hack(require('./hacks/display-flex'));
Value.hack(require('./hacks/display-grid'));
Value.hack(require('./hacks/filter-value'));
var declsCache = {};

var Prefixes = /*#__PURE__*/function () {
  function Prefixes(data, browsers, options) {
    if (options === void 0) {
      options = {};
    }

    this.data = data;
    this.browsers = browsers;
    this.options = options;

    var _this$preprocess = this.preprocess(this.select(this.data));

    this.add = _this$preprocess[0];
    this.remove = _this$preprocess[1];
    this.transition = new Transition(this);
    this.processor = new Processor(this);
  }
  /**
   * Return clone instance to remove all prefixes
   */


  var _proto = Prefixes.prototype;

  _proto.cleaner = function cleaner() {
    if (this.cleanerCache) {
      return this.cleanerCache;
    }

    if (this.browsers.selected.length) {
      var empty = new Browsers(this.browsers.data, []);
      this.cleanerCache = new Prefixes(this.data, empty, this.options);
    } else {
      return this;
    }

    return this.cleanerCache;
  }
  /**
   * Select prefixes from data, which is necessary for selected browsers
   */
  ;

  _proto.select = function select(list) {
    var _this = this;

    var selected = {
      add: {},
      remove: {}
    };

    var _loop = function _loop(name) {
      var data = list[name];
      var add = data.browsers.map(function (i) {
        var params = i.split(' ');
        return {
          browser: params[0] + " " + params[1],
          note: params[2]
        };
      });
      var notes = add.filter(function (i) {
        return i.note;
      }).map(function (i) {
        return _this.browsers.prefix(i.browser) + " " + i.note;
      });
      notes = utils.uniq(notes);
      add = add.filter(function (i) {
        return _this.browsers.isSelected(i.browser);
      }).map(function (i) {
        var prefix = _this.browsers.prefix(i.browser);

        if (i.note) {
          return prefix + " " + i.note;
        } else {
          return prefix;
        }
      });
      add = _this.sort(utils.uniq(add));

      if (_this.options.flexbox === 'no-2009') {
        add = add.filter(function (i) {
          return !i.includes('2009');
        });
      }

      var all = data.browsers.map(function (i) {
        return _this.browsers.prefix(i);
      });

      if (data.mistakes) {
        all = all.concat(data.mistakes);
      }

      all = all.concat(notes);
      all = utils.uniq(all);

      if (add.length) {
        selected.add[name] = add;

        if (add.length < all.length) {
          selected.remove[name] = all.filter(function (i) {
            return !add.includes(i);
          });
        }
      } else {
        selected.remove[name] = all;
      }
    };

    for (var name in list) {
      _loop(name);
    }

    return selected;
  }
  /**
   * Sort vendor prefixes
   */
  ;

  _proto.sort = function sort(prefixes) {
    return prefixes.sort(function (a, b) {
      var aLength = utils.removeNote(a).length;
      var bLength = utils.removeNote(b).length;

      if (aLength === bLength) {
        return b.length - a.length;
      } else {
        return bLength - aLength;
      }
    });
  }
  /**
   * Cache prefixes data to fast CSS processing
   */
  ;

  _proto.preprocess = function preprocess(selected) {
    var add = {
      'selectors': [],
      '@supports': new Supports(Prefixes, this)
    };

    for (var name in selected.add) {
      var prefixes = selected.add[name];

      if (name === '@keyframes' || name === '@viewport') {
        add[name] = new AtRule(name, prefixes, this);
      } else if (name === '@resolution') {
        add[name] = new Resolution(name, prefixes, this);
      } else if (this.data[name].selector) {
        add.selectors.push(Selector.load(name, prefixes, this));
      } else {
        var props = this.data[name].props;

        if (props) {
          var value = Value.load(name, prefixes, this);

          for (var _iterator = _createForOfIteratorHelperLoose(props), _step; !(_step = _iterator()).done;) {
            var prop = _step.value;

            if (!add[prop]) {
              add[prop] = {
                values: []
              };
            }

            add[prop].values.push(value);
          }
        } else {
          var values = add[name] && add[name].values || [];
          add[name] = Declaration.load(name, prefixes, this);
          add[name].values = values;
        }
      }
    }

    var remove = {
      selectors: []
    };

    for (var _name in selected.remove) {
      var _prefixes = selected.remove[_name];

      if (this.data[_name].selector) {
        var selector = Selector.load(_name, _prefixes);

        for (var _iterator2 = _createForOfIteratorHelperLoose(_prefixes), _step2; !(_step2 = _iterator2()).done;) {
          var prefix = _step2.value;
          remove.selectors.push(selector.old(prefix));
        }
      } else if (_name === '@keyframes' || _name === '@viewport') {
        for (var _iterator3 = _createForOfIteratorHelperLoose(_prefixes), _step3; !(_step3 = _iterator3()).done;) {
          var _prefix = _step3.value;

          var prefixed = "@" + _prefix + _name.slice(1);

          remove[prefixed] = {
            remove: true
          };
        }
      } else if (_name === '@resolution') {
        remove[_name] = new Resolution(_name, _prefixes, this);
      } else {
        var _props = this.data[_name].props;

        if (_props) {
          var _value = Value.load(_name, [], this);

          for (var _iterator4 = _createForOfIteratorHelperLoose(_prefixes), _step4; !(_step4 = _iterator4()).done;) {
            var _prefix2 = _step4.value;

            var old = _value.old(_prefix2);

            if (old) {
              for (var _iterator5 = _createForOfIteratorHelperLoose(_props), _step5; !(_step5 = _iterator5()).done;) {
                var _prop = _step5.value;

                if (!remove[_prop]) {
                  remove[_prop] = {};
                }

                if (!remove[_prop].values) {
                  remove[_prop].values = [];
                }

                remove[_prop].values.push(old);
              }
            }
          }
        } else {
          for (var _iterator6 = _createForOfIteratorHelperLoose(_prefixes), _step6; !(_step6 = _iterator6()).done;) {
            var p = _step6.value;
            var olds = this.decl(_name).old(_name, p);

            if (_name === 'align-self') {
              var a = add[_name] && add[_name].prefixes;

              if (a) {
                if (p === '-webkit- 2009' && a.includes('-webkit-')) {
                  continue;
                } else if (p === '-webkit-' && a.includes('-webkit- 2009')) {
                  continue;
                }
              }
            }

            for (var _iterator7 = _createForOfIteratorHelperLoose(olds), _step7; !(_step7 = _iterator7()).done;) {
              var _prefixed = _step7.value;

              if (!remove[_prefixed]) {
                remove[_prefixed] = {};
              }

              remove[_prefixed].remove = true;
            }
          }
        }
      }
    }

    return [add, remove];
  }
  /**
     * Declaration loader with caching
     */
  ;

  _proto.decl = function decl(prop) {
    var decl = declsCache[prop];

    if (decl) {
      return decl;
    } else {
      declsCache[prop] = Declaration.load(prop);
      return declsCache[prop];
    }
  }
  /**
   * Return unprefixed version of property
   */
  ;

  _proto.unprefixed = function unprefixed(prop) {
    var value = this.normalize(vendor.unprefixed(prop));

    if (value === 'flex-direction') {
      value = 'flex-flow';
    }

    return value;
  }
  /**
   * Normalize prefix for remover
   */
  ;

  _proto.normalize = function normalize(prop) {
    return this.decl(prop).normalize(prop);
  }
  /**
   * Return prefixed version of property
   */
  ;

  _proto.prefixed = function prefixed(prop, prefix) {
    prop = vendor.unprefixed(prop);
    return this.decl(prop).prefixed(prop, prefix);
  }
  /**
   * Return values, which must be prefixed in selected property
   */
  ;

  _proto.values = function values(type, prop) {
    var data = this[type];
    var global = data['*'] && data['*'].values;
    var values = data[prop] && data[prop].values;

    if (global && values) {
      return utils.uniq(global.concat(values));
    } else {
      return global || values || [];
    }
  }
  /**
   * Group declaration by unprefixed property to check them
   */
  ;

  _proto.group = function group(decl) {
    var _this2 = this;

    var rule = decl.parent;
    var index = rule.index(decl);
    var length = rule.nodes.length;
    var unprefixed = this.unprefixed(decl.prop);

    var checker = function checker(step, callback) {
      index += step;

      while (index >= 0 && index < length) {
        var other = rule.nodes[index];

        if (other.type === 'decl') {
          if (step === -1 && other.prop === unprefixed) {
            if (!Browsers.withPrefix(other.value)) {
              break;
            }
          }

          if (_this2.unprefixed(other.prop) !== unprefixed) {
            break;
          } else if (callback(other) === true) {
            return true;
          }

          if (step === +1 && other.prop === unprefixed) {
            if (!Browsers.withPrefix(other.value)) {
              break;
            }
          }
        }

        index += step;
      }

      return false;
    };

    return {
      up: function up(callback) {
        return checker(-1, callback);
      },
      down: function down(callback) {
        return checker(+1, callback);
      }
    };
  };

  return Prefixes;
}();

module.exports = Prefixes;