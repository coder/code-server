"use strict";

var _ava = _interopRequireDefault(require("ava"));

var _ = _interopRequireDefault(require(".."));

var _helpers = require("./util/helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

(0, _ava["default"])('node#clone', function (t) {
  (0, _helpers.parse)('[href="test"]', function (selectors) {
    var selector = selectors.first.first;
    var clone = selector.clone();
    delete selector.parent;
    t.deepEqual(clone, selectors.first.first);
  });
});
(0, _ava["default"])('node#clone of attribute', function (t) {
  (0, _helpers.parse)('[href=test]', function (selectors) {
    var selector = selectors.first.first;
    var clone = selector.clone();
    delete selector.parent;
    t.deepEqual(clone, selectors.first.first);
  });
});
(0, _ava["default"])('node#replaceWith', function (t) {
  var out = (0, _helpers.parse)('[href="test"]', function (selectors) {
    var attr = selectors.first.first;

    var id = _["default"].id({
      value: 'test'
    });

    var className = _["default"].className({
      value: 'test'
    });

    attr.replaceWith(id, className);
  });
  t.deepEqual(out, '#test.test');
});
(0, _ava["default"])('Node#appendToPropertyAndEscape', function (t) {
  var out = (0, _helpers.parse)('.fo\\o', function (selectors) {
    var className = selectors.first.first;
    t.deepEqual(className.raws, {
      value: "fo\\o"
    });
    className.appendToPropertyAndEscape("value", "bar", "ba\\r");
    t.deepEqual(className.raws, {
      value: "fo\\oba\\r"
    });
  });
  t.deepEqual(out, '.fo\\oba\\r');
});
(0, _ava["default"])('Node#setPropertyAndEscape with existing raws', function (t) {
  var out = (0, _helpers.parse)('.fo\\o', function (selectors) {
    var className = selectors.first.first;
    t.deepEqual(className.raws, {
      value: "fo\\o"
    });
    className.setPropertyAndEscape("value", "bar", "ba\\r");
    t.deepEqual(className.raws, {
      value: "ba\\r"
    });
  });
  t.deepEqual(out, '.ba\\r');
});
(0, _ava["default"])('Node#setPropertyAndEscape without existing raws', function (t) {
  var out = (0, _helpers.parse)('.foo', function (selectors) {
    var className = selectors.first.first;
    t.deepEqual(className.raws, undefined);
    className.setPropertyAndEscape("value", "bar", "ba\\r");
    t.deepEqual(className.raws, {
      value: "ba\\r"
    });
  });
  t.deepEqual(out, '.ba\\r');
});
(0, _ava["default"])('Node#setPropertyWithoutEscape with existing raws', function (t) {
  var out = (0, _helpers.parse)('.fo\\o', function (selectors) {
    var className = selectors.first.first;
    t.deepEqual(className.raws, {
      value: "fo\\o"
    });
    className.setPropertyWithoutEscape("value", "w+t+f");
    t.deepEqual(className.raws, {});
  });
  t.deepEqual(out, '.w+t+f');
});
(0, _ava["default"])('Node#setPropertyWithoutEscape without existing raws', function (t) {
  var out = (0, _helpers.parse)('.foo', function (selectors) {
    var className = selectors.first.first;
    t.deepEqual(className.raws, undefined);
    className.setPropertyWithoutEscape("value", "w+t+f");
    t.deepEqual(className.raws, {});
    t.deepEqual(className.value, "w+t+f");
  });
  t.deepEqual(out, '.w+t+f');
});
(0, _ava["default"])('Node#isAtPosition', function (t) {
  (0, _helpers.parse)(':not(.foo),\n#foo > :matches(ol, ul)', function (root) {
    t.deepEqual(root.isAtPosition(1, 1), true);
    t.deepEqual(root.isAtPosition(1, 10), true);
    t.deepEqual(root.isAtPosition(2, 23), true);
    t.deepEqual(root.isAtPosition(2, 24), false);
    var selector = root.first;
    t.deepEqual(selector.isAtPosition(1, 1), true);
    t.deepEqual(selector.isAtPosition(1, 10), true);
    t.deepEqual(selector.isAtPosition(1, 11), false);
    var pseudoNot = selector.first;
    t.deepEqual(pseudoNot.isAtPosition(1, 1), true);
    t.deepEqual(pseudoNot.isAtPosition(1, 7), true);
    t.deepEqual(pseudoNot.isAtPosition(1, 10), true);
    t.deepEqual(pseudoNot.isAtPosition(1, 11), false);
    var notSelector = pseudoNot.first;
    t.deepEqual(notSelector.isAtPosition(1, 1), false);
    t.deepEqual(notSelector.isAtPosition(1, 4), false);
    t.deepEqual(notSelector.isAtPosition(1, 5), true);
    t.deepEqual(notSelector.isAtPosition(1, 6), true);
    t.deepEqual(notSelector.isAtPosition(1, 9), true);
    t.deepEqual(notSelector.isAtPosition(1, 10), true);
    t.deepEqual(notSelector.isAtPosition(1, 11), false);
    var notClass = notSelector.first;
    t.deepEqual(notClass.isAtPosition(1, 5), false);
    t.deepEqual(notClass.isAtPosition(1, 6), true);
    t.deepEqual(notClass.isAtPosition(1, 9), true);
    t.deepEqual(notClass.isAtPosition(1, 10), false);
    var secondSel = root.at(1);
    t.deepEqual(secondSel.isAtPosition(1, 11), false);
    t.deepEqual(secondSel.isAtPosition(2, 1), true);
    t.deepEqual(secondSel.isAtPosition(2, 23), true);
    t.deepEqual(secondSel.isAtPosition(2, 24), false);
    var combinator = secondSel.at(1);
    t.deepEqual(combinator.isAtPosition(2, 5), false);
    t.deepEqual(combinator.isAtPosition(2, 6), true);
    t.deepEqual(combinator.isAtPosition(2, 7), false);
  });
});