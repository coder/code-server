"use strict";

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } it = o[Symbol.iterator](); return it.next.bind(it); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var browserslist = require('browserslist');

function capitalize(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

var NAMES = {
  ie: 'IE',
  ie_mob: 'IE Mobile',
  ios_saf: 'iOS',
  op_mini: 'Opera Mini',
  op_mob: 'Opera Mobile',
  and_chr: 'Chrome for Android',
  and_ff: 'Firefox for Android',
  and_uc: 'UC for Android'
};

function prefix(name, prefixes, note) {
  var out = "  " + name;
  if (note) out += ' *';
  out += ': ';
  out += prefixes.map(function (i) {
    return i.replace(/^-(.*)-$/g, '$1');
  }).join(', ');
  out += '\n';
  return out;
}

module.exports = function (prefixes) {
  if (prefixes.browsers.selected.length === 0) {
    return 'No browsers selected';
  }

  var versions = {};

  for (var _iterator = _createForOfIteratorHelperLoose(prefixes.browsers.selected), _step; !(_step = _iterator()).done;) {
    var _browser = _step.value;

    var parts = _browser.split(' ');

    var _name2 = parts[0];
    var version = parts[1];
    _name2 = NAMES[_name2] || capitalize(_name2);

    if (versions[_name2]) {
      versions[_name2].push(version);
    } else {
      versions[_name2] = [version];
    }
  }

  var out = 'Browsers:\n';

  for (var browser in versions) {
    var list = versions[browser];
    list = list.sort(function (a, b) {
      return parseFloat(b) - parseFloat(a);
    });
    out += "  " + browser + ": " + list.join(', ') + "\n";
  }

  var coverage = browserslist.coverage(prefixes.browsers.selected);
  var round = Math.round(coverage * 100) / 100.0;
  out += "\nThese browsers account for " + round + "% of all users globally\n";
  var atrules = [];

  for (var name in prefixes.add) {
    var data = prefixes.add[name];

    if (name[0] === '@' && data.prefixes) {
      atrules.push(prefix(name, data.prefixes));
    }
  }

  if (atrules.length > 0) {
    out += "\nAt-Rules:\n" + atrules.sort().join('');
  }

  var selectors = [];

  for (var _iterator2 = _createForOfIteratorHelperLoose(prefixes.add.selectors), _step2; !(_step2 = _iterator2()).done;) {
    var selector = _step2.value;

    if (selector.prefixes) {
      selectors.push(prefix(selector.name, selector.prefixes));
    }
  }

  if (selectors.length > 0) {
    out += "\nSelectors:\n" + selectors.sort().join('');
  }

  var values = [];
  var props = [];
  var hadGrid = false;

  for (var _name in prefixes.add) {
    var _data = prefixes.add[_name];

    if (_name[0] !== '@' && _data.prefixes) {
      var grid = _name.indexOf('grid-') === 0;
      if (grid) hadGrid = true;
      props.push(prefix(_name, _data.prefixes, grid));
    }

    if (!Array.isArray(_data.values)) {
      continue;
    }

    for (var _iterator3 = _createForOfIteratorHelperLoose(_data.values), _step3; !(_step3 = _iterator3()).done;) {
      var value = _step3.value;

      var _grid = value.name.includes('grid');

      if (_grid) hadGrid = true;
      var string = prefix(value.name, value.prefixes, _grid);

      if (!values.includes(string)) {
        values.push(string);
      }
    }
  }

  if (props.length > 0) {
    out += "\nProperties:\n" + props.sort().join('');
  }

  if (values.length > 0) {
    out += "\nValues:\n" + values.sort().join('');
  }

  if (hadGrid) {
    out += '\n* - Prefixes will be added only on grid: true option.\n';
  }

  if (!atrules.length && !selectors.length && !props.length && !values.length) {
    out += '\nAwesome! Your browsers don\'t require any vendor prefixes.' + '\nNow you can remove Autoprefixer from build steps.';
  }

  return out;
};